import {
  confirmClaimRewards,
  confirmClaimRewardsWithRoot,
  confirmVot3Distribution,
  confirmVot3Swap,
  confirmVoteWhileClaiming,
  getAmountOfAccounts,
  getRootSigner,
  getRoundId,
  getStartIndex,
} from "./helpers/CliArguments";
import {
  ThorClient,
  Contract,
  VeChainProvider,
  ProviderInternalBaseWallet,
  ContractClause,
  VeChainSigner,
} from "@vechain/sdk-network";
import { clauseBuilder, coder, ZERO_ADDRESS } from "@vechain/sdk-core";
import {
  Wallet,
  Interface,
  formatUnits,
  FunctionFragment,
  HDNodeWallet,
  ethers,
} from "ethers";
import { Addresses, appIds } from "./helpers/constants";
import { B3trAbi, GovAbi, RewarderAbi, Vot3Abi } from "./helpers/Abis";
const thor = ThorClient.fromUrl("https://de.node.vechain.energy");
const sleep = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));
const depositAmount = ethers.parseUnits("1");

async function main() {
  // Ask user the amount of accounts to distribute to and the root signer mnemonic
  const amountOfAccounts = await getAmountOfAccounts();
  const startIndex = await getStartIndex();
  const mnemonic = await getRootSigner();
  const roundId = await getRoundId();
  const voteWhileClaiming = await confirmVoteWhileClaiming();

  // Retrieve the root signer wallet and account, WARNING: uses the ethereum derivation path
  const rootWallet = Wallet.fromPhrase(mnemonic);

  const rootAccount = {
    privateKey: Buffer.from(rootWallet.privateKey.slice(2), "hex"),
    address: rootWallet.address,
  };
  const provider = new VeChainProvider(
    thor,
    new ProviderInternalBaseWallet([rootAccount])
  );
  const rootSigner = await provider.getSigner(rootAccount.address);

  if (!rootSigner) {
    throw new Error("Root signer is null");
  }

  console.log(`Root signer address: ${rootAccount.address}`);

  const [rootB3trBalanceResult, rootVot3BalanceResult] = await Promise.all([
    thor.contracts.executeCall(
      Addresses.b3tr,
      "balanceOf(address) returns(uint256)" as any as FunctionFragment,
      [rootWallet.address]
    ),
    thor.contracts.executeCall(
      Addresses.vot3,
      "balanceOf(address) returns(uint256)" as any as FunctionFragment,
      [rootWallet.address]
    ),
  ]);

  let rootB3trBalance = BigInt(rootB3trBalanceResult[0]);
  let rootVot3Balance = BigInt(rootVot3BalanceResult[0]);

  console.log(
    `Root signer has ${formatUnits(
      rootB3trBalance.toString(),
      18
    )} B3TR and ${formatUnits(rootVot3Balance.toString(), 18)} VOT3`
  );

  const claimWithRoot = await confirmClaimRewardsWithRoot();
  if (claimWithRoot) {
    await claimRewardsWithRootSigner(rootWallet, rootSigner, roundId);
  }

  const proceed = await confirmClaimRewards();
  if (!proceed) {
    console.log("Exiting...");
    return;
  }

  // Claim rewards
  await claimRewards(
    rootWallet,
    rootAccount,
    rootSigner,
    amountOfAccounts,
    startIndex,
    roundId,
    voteWhileClaiming
  );
}

const claimRewardsWithRootSigner = async (
  rootWallet: HDNodeWallet,
  rootSigner: VeChainSigner,
  roundId: number
) => {
  const [[pendingRewardsResult]] = await Promise.all([
    thor.contracts.executeCall(
      Addresses.rewarder,
      "getReward(uint256,address) returns(uint256)" as any as FunctionFragment,
      [roundId, rootWallet.address]
    ),
  ]);

  const pendingRewards = BigInt(pendingRewardsResult);

  console.log(
    `Root signer has ${formatUnits(
      pendingRewards.toString(),
      18
    )} pending rewards`
  );

  if (pendingRewards > BigInt(0)) {
    await thor.contracts.executeTransaction(
      rootSigner,
      Addresses.rewarder,
      "function claimReward(uint256 cycle, address voter)" as any as FunctionFragment,
      [roundId, rootWallet.address]
    );
  }
};

const claimRewards = async (
  rootWallet: HDNodeWallet,
  rootAccount: { privateKey: Buffer; address: string },
  rootSigner: VeChainSigner,
  amountOfAccounts: number,
  startIndex: number,
  roundId: number,
  allowVoting = false
) => {
  const B3TR = new Contract(Addresses.b3tr, B3trAbi, thor, rootSigner);
  for (
    let accountIndex = startIndex;
    accountIndex < amountOfAccounts;
    accountIndex += 1
  ) {
    try {
      const wallet = rootWallet.deriveChild(accountIndex);
      const provider = new VeChainProvider(
        thor,
        new ProviderInternalBaseWallet(
          [
            {
              privateKey: Buffer.from(wallet.privateKey.slice(2), "hex"),
              address: wallet.address,
            },
          ],
          {
            delegator: {
              delegatorPrivateKey: rootWallet.privateKey.slice(2),
            },
          }
        ),
        true
      );
      const signer = await provider.getSigner(wallet.address);
      if (!signer) {
        throw new Error("Signer is null");
      }

      const [[pendingRewardsResult]] = await Promise.all([
        thor.contracts.executeCall(
          Addresses.rewarder,
          "getReward(uint256,address) returns(uint256)" as any as FunctionFragment,
          [roundId, wallet.address]
        ),
      ]);

      const pendingRewards = BigInt(pendingRewardsResult);

      console.log("#", accountIndex, "/", amountOfAccounts, wallet.address);
      console.log("Pending rewards:", formatUnits(pendingRewards));

      if (pendingRewards > BigInt(0)) {
        console.log("      Claiming Rewards:", formatUnits(pendingRewards));

        const clauses = [
          {
            clause: {
              to: Addresses.rewarder,
              value: "0x0",
              data: new Interface(RewarderAbi).encodeFunctionData(
                "claimReward",
                [roundId, wallet.address]
              ),
            },
            functionFragment: coder
              .createInterface(RewarderAbi)
              .getFunction("claimReward") as FunctionFragment,
          },
          {
            clause: {
              to: Addresses.b3tr,
              value: "0x0",
              data: new Interface(B3TR.abi).encodeFunctionData("transfer", [
                rootAccount.address,
                pendingRewards,
              ]),
            },
            functionFragment: coder
              .createInterface(B3TR.abi)
              .getFunction("transfer") as FunctionFragment,
          },
        ];

        if (allowVoting) {
          const currentRoundId = BigInt(
            (
              await thor.contracts.executeCall(
                Addresses.gov,
                "currentRoundId() returns(uint256)" as any as FunctionFragment,
                []
              )
            )[0]
          );
          const currentRoundSnapshot = BigInt(
            (
              await thor.contracts.executeCall(
                Addresses.gov,
                "roundSnapshot(uint256) returns(uint256)" as any as FunctionFragment,
                [currentRoundId]
              )
            )[0]
          );

          const [
            [b3trBalanceResult],
            [vot3BalanceResult],
            [delegate],
            [availableVotes],
            [hasVotedResult],
          ] = await Promise.all([
            thor.contracts.executeCall(
              Addresses.b3tr,
              "balanceOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            ),
            thor.contracts.executeCall(
              Addresses.vot3,
              "balanceOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            ),
            thor.contracts.executeCall(
              Addresses.vot3,
              "delegates(address) returns(address)" as any as FunctionFragment,
              [wallet.address]
            ),
            thor.contracts.executeCall(
              Addresses.gov,
              "getVotes(address,uint256) returns(uint256)" as any as FunctionFragment,
              [wallet.address, currentRoundSnapshot]
            ),
            thor.contracts.executeCall(
              Addresses.gov,
              "hasVoted(uint256,address) returns(bool)" as any as FunctionFragment,
              [currentRoundId, wallet.address]
            ),
          ]);

          let b3trBalance = BigInt(b3trBalanceResult);
          let vot3Balance = BigInt(vot3BalanceResult);
          let availableVotesAmount = BigInt(availableVotes);
          let hasVoted = hasVotedResult;
          console.log(
            "B3TR:",
            formatUnits(b3trBalance),
            "VOT3:",
            formatUnits(vot3Balance),
            "AVAILABLE VOTES: ",
            formatUnits(availableVotesAmount)
          );
          // vote in same TX to save gas, duplicate code
          if (availableVotesAmount > BigInt(0) && !hasVoted) {
            hasVoted = true;

            const randomIndex = Math.floor(Math.random() * appIds.length);
            const appId = appIds[randomIndex];
            clauses.push({
              clause: {
                to: Addresses.gov,
                value: "0x0",
                data: new Interface(GovAbi).encodeFunctionData("castVote", [
                  currentRoundId,
                  [appId],
                  [availableVotesAmount],
                ]),
              },
              functionFragment: coder
                .createInterface(GovAbi)
                .getFunction("castVote") as FunctionFragment,
            });
          }
        }

        await thor.contracts.executeMultipleClausesTransaction(clauses, signer);
      }
    } catch (err) {
      console.error(err);
      await sleep(5);
      accountIndex -= 1;
    }
  }
};

// Execute the main function
main();

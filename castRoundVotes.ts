import {
  confirmVoteRound,
  getAmountOfAccounts,
  getRootSigner,
} from "./helpers/CliArguments";
import {
  ThorClient,
  VeChainProvider,
  ProviderInternalBaseWallet,
} from "@vechain/sdk-network";
import { Wallet, formatUnits, FunctionFragment, HDNodeWallet } from "ethers";
import { Addresses, appIds } from "./helpers/constants";

const thor = ThorClient.fromUrl("https://node.vechain.energy");
const sleep = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));

async function main() {
  // Ask user the amount of accounts to distribute to and the root signer mnemonic
  const amountOfAccounts = await getAmountOfAccounts();
  const mnemonic = await getRootSigner();

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

  const proceed = await confirmVoteRound();
  if (!proceed) {
    console.log("Exiting...");
    return;
  }

  // Vote for apps
  await voteForApps(amountOfAccounts, rootWallet);
}

const voteForApps = async (
  amountOfAccounts: number,
  rootWallet: HDNodeWallet
) => {
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
  console.log(
    "Current round ID",
    currentRoundId.toString(),
    currentRoundSnapshot.toString()
  );

  for (
    let accountIndex = 0;
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
      let hasVoted = Boolean(hasVotedResult);

      console.log("#", accountIndex, "/", amountOfAccounts, wallet.address);
      console.log(
        "B3TR:",
        formatUnits(b3trBalance),
        "VOT3:",
        formatUnits(vot3Balance),
        "power: ",
        formatUnits(availableVotesAmount),
        "hasVoted: ",
        hasVoted
      );

      // vote in same TX to save gas, duplicate code
      if (availableVotesAmount > BigInt(0) && !hasVoted) {
        hasVoted = true;

        console.log("Voting for random app");

        const randomIndex = Math.floor(Math.random() * appIds.length);
        const appId = appIds[randomIndex];
        await thor.contracts.executeTransaction(
          signer,
          Addresses.gov,
          "function castVote(uint256 roundId, bytes32[] memory appIds, uint256[] memory voteWeights)" as any as FunctionFragment,
          [currentRoundId, [appId], [availableVotesAmount]]
        );
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

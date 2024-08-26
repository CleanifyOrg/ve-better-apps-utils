import {
  confirmClaimRewards,
  confirmClaimRewardsWithRoot,
  confirmConvertVot3ToB3tr,
  confirmVot3Distribution,
  confirmVot3Swap,
  confirmVoteWhileClaiming,
  genericConfirmation,
  getAmountOfAccounts,
  getReceiver,
  getRootSigner,
  getRoundId,
  getStartIndex,
  transferTokensFromRoot,
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
const depositAmount = ethers.parseUnits("50");

async function main() {
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

  const proceedVot3Swap = await confirmConvertVot3ToB3tr();

  // Swap VOT3 for B3TR
  if (proceedVot3Swap) {
    await convertVot3ToB3tr(
      rootSigner,
      rootWallet,
      rootB3trBalance,
      rootVot3Balance
    );
  }

  const proceedWithTransfer = await transferTokensFromRoot();
  if (!proceedWithTransfer) {
    console.log("Exiting...");
    return;
  }

  const receiverAddress = await getReceiver();
  const [updatedRootB3trBalanceResult] = await Promise.all([
    thor.contracts.executeCall(
      Addresses.b3tr,
      "balanceOf(address) returns(uint256)" as any as FunctionFragment,
      [rootWallet.address]
    ),
  ]);

  rootB3trBalance = BigInt(updatedRootB3trBalanceResult[0]);
  console.log(
    `Transferring ${formatUnits(
      rootB3trBalance.toString(),
      18
    )} B3TR to ${receiverAddress}`
  );

  const proceed = await genericConfirmation();

  if (!proceed) {
    console.log("Exiting...");
    return;
  }

  // Transfer B3TR to receiver
  await transferB3tr(receiverAddress, rootB3trBalance, rootWallet, rootSigner);
}

const convertVot3ToB3tr = async (
  rootSigner: any,
  rootWallet: HDNodeWallet,
  rootB3trBalance: BigInt,
  rootVot3Balance: BigInt
) => {
  const B3TR = new Contract(Addresses.b3tr, B3trAbi, thor, rootSigner);
  const VOT3 = new Contract(Addresses.vot3, Vot3Abi, thor, rootSigner);

  console.log("Converting VOT3 to B3TR on root", rootVot3Balance);
  const clauses: ContractClause[] = [
    {
      clause: {
        to: Addresses.vot3,
        value: "0x0",
        data: new Interface(VOT3.abi).encodeFunctionData("approve", [
          Addresses.vot3,
          rootVot3Balance,
        ]),
      },
      functionFragment: coder
        .createInterface(Vot3Abi)
        .getFunction("approve") as FunctionFragment,
    },
    {
      clause: {
        to: Addresses.vot3,
        value: "0x0",
        data: new Interface(VOT3.abi).encodeFunctionData("convertToB3TR", [
          rootVot3Balance,
        ]),
      },
      functionFragment: coder
        .createInterface(Vot3Abi)
        .getFunction("convertToB3TR") as FunctionFragment,
    },
  ];

  await (
    await thor.contracts.executeMultipleClausesTransaction(clauses, rootSigner)
  ).wait();
  await sleep(10);

  rootB3trBalance = BigInt(
    (
      await thor.contracts.executeCall(
        Addresses.b3tr,
        "balanceOf(address) returns(uint256)" as any as FunctionFragment,
        [rootWallet.address]
      )
    )[0]
  );
  rootVot3Balance = BigInt(
    (
      await thor.contracts.executeCall(
        Addresses.vot3,
        "balanceOf(address) returns(uint256)" as any as FunctionFragment,
        [rootWallet.address]
      )
    )[0]
  );

  console.log(
    `Root signer now has ${formatUnits(
      rootB3trBalance.toString(),
      18
    )} B3TR and ${formatUnits(rootVot3Balance.toString(), 18)} VOT3`
  );
};

const transferB3tr = async (
  receiverAddress: string,
  amount: BigInt,
  rootWallet: HDNodeWallet,
  rootSigner: VeChainSigner
) => {
  const B3TR = new Contract(Addresses.b3tr, B3trAbi, thor, rootSigner);

  const clauses: ContractClause[] = [
    {
      clause: {
        to: Addresses.b3tr,
        value: "0x0",
        data: new Interface(B3TR.abi).encodeFunctionData("transfer", [
          receiverAddress,
          amount,
        ]),
      },
      functionFragment: coder
        .createInterface(B3trAbi)
        .getFunction("transfer") as FunctionFragment,
    },
  ];

  await (
    await thor.contracts.executeMultipleClausesTransaction(clauses, rootSigner)
  ).wait();

  console.log(
    `Transferred ${formatUnits(
      amount.toString(),
      18
    )} B3TR to ${receiverAddress}`
  );

  const receiverB3trBalance = BigInt(
    (
      await thor.contracts.executeCall(
        Addresses.b3tr,
        "balanceOf(address) returns(uint256)" as any as FunctionFragment,
        [receiverAddress]
      )
    )[0]
  );

  console.log(
    `Receiver now has ${formatUnits(receiverB3trBalance.toString(), 18)} B3TR`
  );

  const senderB3trBalance = BigInt(
    (
      await thor.contracts.executeCall(
        Addresses.b3tr,
        "balanceOf(address) returns(uint256)" as any as FunctionFragment,
        [rootWallet.address]
      )
    )[0]
  );

  console.log(
    `Sender now has ${formatUnits(senderB3trBalance.toString(), 18)} B3TR`
  );
};

// Execute the main function
main();

import {
  confirmVot3Swap,
  getAmountOfAccounts,
  getRootSigner,
} from "./helpers/CliArguments";
import {
  ThorClient,
  Contract,
  VeChainProvider,
  ProviderInternalBaseWallet,
  ContractClause,
} from "@vechain/sdk-network";
import { clauseBuilder, coder } from "@vechain/sdk-core";
import { Wallet, Interface, formatUnits, FunctionFragment } from "ethers";
import { Addresses } from "./helpers/constants";
import { B3trAbi, Vot3Abi } from "./helpers/Abis";
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

  const B3TR = new Contract(Addresses.b3tr, B3trAbi, thor, rootSigner);

  const VOT3 = new Contract(Addresses.vot3, Vot3Abi, thor, rootSigner);

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

  const proceed = await confirmVot3Swap();
  if (!proceed) {
    console.log("Exiting...");
    return;
  }

  if (rootB3trBalance > BigInt(0)) {
    console.log("Converting B3TR to VOT3 on root", rootB3trBalance);
    const clauses: ContractClause[] = [
      {
        clause: {
          to: Addresses.b3tr,
          value: "0x0",
          data: new Interface(B3TR.abi).encodeFunctionData("approve", [
            Addresses.vot3,
            rootB3trBalance,
          ]),
        },
        functionFragment: coder
          .createInterface(B3trAbi)
          .getFunction("approve") as FunctionFragment,
      },
      {
        clause: {
          to: Addresses.vot3,
          value: "0x0",
          data: new Interface(VOT3.abi).encodeFunctionData("convertToVOT3", [
            rootB3trBalance,
          ]),
        },
        functionFragment: coder
          .createInterface(Vot3Abi)
          .getFunction("convertToVOT3") as FunctionFragment,
      },
    ];

    await (
      await thor.contracts.executeMultipleClausesTransaction(
        clauses,
        rootSigner
      )
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
  }

  console.log(
    `Root signer now has ${formatUnits(
      rootB3trBalance.toString(),
      18
    )} B3TR and ${formatUnits(rootVot3Balance.toString(), 18)} VOT3`
  );
}

// Execute the main function
main();

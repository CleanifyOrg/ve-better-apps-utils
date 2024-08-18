import {
  confirmVot3Distribution,
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
import { clauseBuilder, coder, ZERO_ADDRESS } from "@vechain/sdk-core";
import {
  Wallet,
  Interface,
  formatUnits,
  FunctionFragment,
  HDNodeWallet,
  ethers,
} from "ethers";
import { Addresses } from "./helpers/constants";
import { B3trAbi, Vot3Abi } from "./helpers/Abis";
const thor = ThorClient.fromUrl("https://node.vechain.energy");
const sleep = (s: number) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));
const depositAmount = ethers.parseUnits("1");

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

  if (rootB3trBalance > BigInt(0)) {
    const proceed = await confirmVot3Swap();
    if (!proceed) {
      console.log("Exiting...");
      return;
    }

    await convertToVot3(
      rootSigner,
      rootWallet,
      rootB3trBalance,
      rootVot3Balance
    );
  } else {
    console.log("Root signer has no B3TR to convert.");
  }

  if (rootVot3Balance > BigInt(0)) {
    const proceed = await confirmVot3Distribution();
    if (!proceed) {
      console.log("Exiting...");
      return;
    }

    await distributeVot3(
      rootSigner,
      rootWallet,
      amountOfAccounts,
      rootB3trBalance,
      rootVot3Balance,
      rootAccount
    );
  }
}

export const convertToVot3 = async (
  rootSigner: any,
  rootWallet: HDNodeWallet,
  rootB3trBalance: BigInt,
  rootVot3Balance: BigInt
) => {
  const B3TR = new Contract(Addresses.b3tr, B3trAbi, thor, rootSigner);

  const VOT3 = new Contract(Addresses.vot3, Vot3Abi, thor, rootSigner);

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

export const distributeVot3 = async (
  rootSigner: any,
  rootWallet: HDNodeWallet,
  amountOfAccounts: number,
  rootB3trBalance: BigInt,
  rootVot3Balance: BigInt,
  rootAccount: { address: string; privateKey: Buffer }
) => {
  const B3TR = new Contract(Addresses.b3tr, B3trAbi, thor, rootSigner);
  const VOT3 = new Contract(Addresses.vot3, Vot3Abi, thor, rootSigner);

  const rootStakedB3tr = BigInt(
    (
      await thor.contracts.executeCall(
        Addresses.vot3,
        "convertedB3trOf(address) returns(uint256)" as any as FunctionFragment,
        [rootWallet.address]
      )
    )[0]
  );
  console.log("Root signer has", formatUnits(rootStakedB3tr), "staked B3TR");

  const rootClauses = [];
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

      const [[b3trBalanceResult], [vot3BalanceResult], [delegate]] =
        await Promise.all([
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
        ]);

      let b3trBalance = BigInt(b3trBalanceResult);
      let vot3Balance = BigInt(vot3BalanceResult);

      console.log("#", accountIndex, "/", amountOfAccounts, wallet.address);
      console.log(
        "B3TR:",
        formatUnits(b3trBalance),
        "VOT3:",
        formatUnits(vot3Balance)
      );

      if (
        b3trBalance + vot3Balance < depositAmount &&
        BigInt(rootB3trBalance.toString()) >= depositAmount
      ) {
        const requiredDeposit = depositAmount - b3trBalance - vot3Balance;
        console.log("Need deposit, sending B3TR", requiredDeposit);
        await // @ts-ignore
        (await B3TR.transact.transfer(wallet.address, requiredDeposit)).wait();

        b3trBalance = BigInt(
          (
            await thor.contracts.executeCall(
              Addresses.b3tr,
              "balanceOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            )
          )[0]
        );
        vot3Balance = BigInt(
          (
            await thor.contracts.executeCall(
              Addresses.vot3,
              "balanceOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            )
          )[0]
        );
      } else if (
        b3trBalance + vot3Balance < depositAmount &&
        BigInt(rootVot3Balance.toString()) >= depositAmount
      ) {
        const requiredDeposit = depositAmount - b3trBalance - vot3Balance;
        console.log("Need deposit, sending VOT3", requiredDeposit);

        rootClauses.push({
          clause: {
            to: Addresses.vot3,
            value: "0x0",
            data: new Interface(VOT3.abi).encodeFunctionData("transfer", [
              wallet.address,
              requiredDeposit,
            ]),
          },
          functionFragment: coder
            .createInterface(Vot3Abi)
            .getFunction("transfer") as FunctionFragment,
        });
      }

      if (vot3Balance > depositAmount) {
        const stakedB3tr = BigInt(
          (
            await thor.contracts.executeCall(
              Addresses.vot3,
              "convertedB3trOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            )
          )[0]
        );

        const withdrawAmount = vot3Balance - depositAmount;
        const unstakeAmount =
          withdrawAmount > stakedB3tr ? stakedB3tr : withdrawAmount;
        console.log("Need to withdraw", unstakeAmount);

        const clauses = [];

        if (unstakeAmount > BigInt(0)) {
          console.log("Unstaking", unstakeAmount);
          clauses.push(
            {
              clause: {
                to: Addresses.vot3,
                value: "0x0",
                data: new Interface(VOT3.abi).encodeFunctionData(
                  "convertToB3TR",
                  [unstakeAmount]
                ),
              },
              functionFragment: coder
                .createInterface(Vot3Abi)
                .getFunction("convertToB3TR") as FunctionFragment,
            },
            {
              clause: {
                to: Addresses.b3tr,
                value: "0x0",
                data: new Interface(B3TR.abi).encodeFunctionData("transfer", [
                  rootAccount.address,
                  unstakeAmount,
                ]),
              },
              functionFragment: coder
                .createInterface(B3trAbi)
                .getFunction("transfer") as FunctionFragment,
            }
          );
        }

        if (withdrawAmount > unstakeAmount) {
          console.log("Withdrawing VOT3", withdrawAmount - unstakeAmount);
          clauses.push({
            clause: {
              to: Addresses.vot3,
              value: "0x0",
              data: new Interface(VOT3.abi).encodeFunctionData("transfer", [
                rootAccount.address,
                withdrawAmount - unstakeAmount,
              ]),
            },
            functionFragment: coder
              .createInterface(Vot3Abi)
              .getFunction("transfer") as FunctionFragment,
          });
        }

        await (
          await thor.contracts.executeMultipleClausesTransaction(
            clauses,
            signer
          )
        ).wait();
        await sleep(10);

        b3trBalance = BigInt(
          (
            await thor.contracts.executeCall(
              Addresses.b3tr,
              "balanceOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            )
          )[0]
        );
        vot3Balance = BigInt(
          (
            await thor.contracts.executeCall(
              Addresses.vot3,
              "balanceOf(address) returns(uint256)" as any as FunctionFragment,
              [wallet.address]
            )
          )[0]
        );
      }

      if (b3trBalance > BigInt(0)) {
        console.log("Need to convert B3TR to VOT3", b3trBalance);
        const clauses = [
          {
            clause: {
              to: Addresses.b3tr,
              value: "0x0",
              data: new Interface(B3TR.abi).encodeFunctionData("approve", [
                Addresses.vot3,
                b3trBalance,
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
              data: new Interface(VOT3.abi).encodeFunctionData(
                "convertToVOT3",
                [b3trBalance]
              ),
            },
            functionFragment: coder
              .createInterface(Vot3Abi)
              .getFunction("convertToVOT3") as FunctionFragment,
          },
        ];
        await (
          await thor.contracts.executeMultipleClausesTransaction(
            clauses,
            signer
          )
        ).wait();
        await sleep(10);
      }

      if (delegate === ZERO_ADDRESS) {
        console.log(
          "Need to set delegatee to",
          wallet.address,
          "(is:",
          delegate,
          ")"
        );
        await thor.contracts.executeTransaction(
          signer,
          Addresses.vot3,
          "delegate(address)" as any as FunctionFragment,
          [wallet.address]
        );
      }

      if (rootClauses.length >= 125) {
        await thor.contracts.executeMultipleClausesTransaction(
          rootClauses,
          rootSigner
        );
        rootClauses.length = 0;
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

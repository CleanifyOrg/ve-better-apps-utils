import { ThorClient } from "@vechain/sdk-network";
import { X2EarnRewardsPool } from "@vechain/vebetterdao-contracts";
import { ethers } from "ethers";

const APP_ID =
  "0x821a9ae30590c7c11e0ebc03b27902e8cae0f320ad27b0f5bde9f100eebcb5a7";

async function main() {
  const thor = ThorClient.fromUrl("https://mainnet.vechain.org");

  // Call the method
  const x2EarnRewardsPoolContract = thor.contracts.load(
    X2EarnRewardsPool.address.mainnet,
    X2EarnRewardsPool.abi
  );

  const balance = await x2EarnRewardsPoolContract.read.availableFunds(APP_ID);

  console.log(
    `Available funds for app ${APP_ID}: ${ethers.formatEther(
      balance.toString()
    )} B3TR`
  );
}

main();

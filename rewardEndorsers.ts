import { ThorClient } from "@vechain/sdk-network";
import { abi, unitsUtils } from "@vechain/sdk-core";
import {
  X2EarnApps,
  XAllocationPool,
  XAllocationVoting,
} from "@vechain/vebetterdao-contracts";
import {
  getEnvironment,
  getAppId,
  getRoundId,
  selectApp,
} from "./helpers/CliArguments";
import { getConfig } from "./config";
import { log } from "winston";

async function main() {
  // Get user inputs
  const environment = await getEnvironment();
  const config = getConfig(environment);

  // Initialize Thor client based on environment
  const thorClient = ThorClient.fromUrl(config.nodeUrl);

  // Get apps
  const [apps] = await thorClient.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    X2EarnApps.interface.getFunction("apps"),
    []
  );

  // Let user select an app
  const selectedAppId = await selectApp(apps);

  // Get round
  const roundId = await getRoundId();

  try {
    // get how much the app earned in the round
    const [appEarningsResult] = await thorClient.contracts.executeCall(
      config.xAllocationPoolContractAddress,
      XAllocationPool.interface.getFunction("roundEarnings"),
      [roundId, selectedAppId]
    );
    console.log(
      "App earnings:",
      unitsUtils.formatUnits(appEarningsResult),
      "B3TR"
    );

    // calculate the 5% reward entitled to the endorsers
    const reward = (appEarningsResult * BigInt(5)) / BigInt(100);

    // Retrieve the endorsers
    // Call getEndorsers function
    const [endorsersResult] = await thorClient.contracts.executeCall(
      config.x2EarnAppsContractAddress,
      X2EarnApps.interface.getFunction("getEndorsers"),
      [selectedAppId]
    );

    // Parse the result (array of addresses)
    const endorsers = endorsersResult as string[];

    console.log("Number of endorsers:", endorsers.length);

    // Create a single array to store all endorser information
    const endorserInfo: { address: string; score: bigint; amount: bigint }[] =
      [];

    // Get scores and store in combined array (single loop instead of multiple)
    for (const address of endorsers) {
      const [scoreResult] = await thorClient.contracts.executeCall(
        config.x2EarnAppsContractAddress,
        X2EarnApps.interface.getFunction("getUsersEndorsementScore"),
        [address]
      );
      endorserInfo.push({
        address,
        score: BigInt(scoreResult),
        amount: BigInt(0), // Will be calculated later
      });
    }

    // Calculate total score from the existing data
    const totalScore = endorserInfo.reduce(
      (acc, { score }) => acc + score,
      BigInt(0)
    );

    // Calculate rewards in place
    let remainingReward = reward;

    endorserInfo.forEach((info, index) => {
      const isLast = index === endorserInfo.length - 1;

      if (isLast) {
        info.amount = remainingReward;
      } else {
        info.amount = (reward * info.score) / totalScore;
        remainingReward -= info.amount;
      }
    });

    // Log the complete distribution
    console.log("\nRewards Distribution:");
    for (const info of endorserInfo) {
      console.log(`Address: ${info.address}`);
      console.log(`Score: ${info.score}`);
      console.log(`Reward: ${unitsUtils.formatUnits(info.amount)} B3TR`);
      console.log("-------------------");
    }
  } catch (error) {
    console.error("Error fetching endorsers:", error);
  }
}

main();

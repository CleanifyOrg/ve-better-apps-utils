import localConfig from "./local";
import mainnetConfig from "./mainnet";

export type AppConfig = {
  environment: "local" | "testnet" | "mainnet";
  b3trContractAddress: string;
  vot3ContractAddress: string;
  b3trGovernorAddress: string;
  timelockContractAddress: string;
  xAllocationPoolContractAddress: string;
  xAllocationVotingContractAddress: string;
  emissionsContractAddress: string;
  voterRewardsContractAddress: string;
  galaxyMemberContractAddress: string;
  treasuryContractAddress: string;
  x2EarnAppsContractAddress: string;
  x2EarnCreatorContractAddress: string;
  x2EarnRewardsPoolContractAddress: string;
  nodeManagementContractAddress: string;
  veBetterPassportContractAddress: string;
  nodeUrl: string;
};

export const getConfig = (env?: "local" | "mainnet"): AppConfig => {
  const appEnv = env || process.env.NEXT_PUBLIC_APP_ENV;
  if (!appEnv)
    throw new Error(
      "NEXT_PUBLIC_APP_ENV env variable must be set or a type must be passed to getConfig()"
    );
  if (appEnv === "local") return localConfig;
  if (appEnv === "mainnet") return mainnetConfig;
  throw new Error(`Unsupported NEXT_PUBLIC_APP_ENV ${appEnv}`);
};

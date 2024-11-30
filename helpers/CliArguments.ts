import enquirer from "enquirer";
import { logger } from "./Logger";

type ConfirmationResponse = {
  answer: "No" | "Yes";
};

export const getStartIndex = async (): Promise<number> => {
  const res = await enquirer.prompt<{ amount: string }>([
    {
      type: "input",
      name: "amount",
      message: "From what account do you want to start?",
      validate: (input) => {
        if (isNaN(Number(input))) {
          return "Please enter a valid number";
        }
        return true;
      },
    },
  ]);

  const startIndex = parseInt(res.amount);
  if (isNaN(startIndex)) {
    logger.error("Please enter a valid number");
    return getStartIndex();
  }
  return startIndex;
};

export const getRootSigner = async (): Promise<string> => {
  const res = await enquirer.prompt<{ rootSigner: string }>([
    {
      type: "input",
      name: "rootSigner",
      message: "Enter the root signer mnemonic",
    },
  ]);

  return res.rootSigner;
};

export const getRoundId = async (): Promise<number> => {
  const res = await enquirer.prompt<{ roundId: string }>([
    {
      type: "input",
      name: "roundId",
      message: "For which round do you want to claim rewards?",
      validate: (input) => {
        if (isNaN(Number(input))) {
          return "Please enter a valid number";
        }
        return true;
      },
    },
  ]);

  const roundId = parseInt(res.roundId);
  if (isNaN(roundId)) {
    logger.error("Please enter a valid number");
    return getRoundId();
  }
  return roundId;
};

export const genericConfirmation = async (): Promise<boolean> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `Are you sure you want to proceed?`,
      choices: ["No", "Yes"],
    },
  ]);

  return res.answer === "Yes";
};

export const getEnvironment = async (): Promise<
  "local" | "testnet" | "mainnet"
> => {
  const res = await enquirer.prompt<{
    environment: "local" | "testnet" | "mainnet";
  }>([
    {
      type: "select",
      name: "environment",
      message: "Which environment do you want to use?",
      choices: ["local", "testnet", "mainnet"],
    },
  ]);

  return res.environment;
};

export const getAppId = async (): Promise<number> => {
  const res = await enquirer.prompt<{ appId: string }>([
    {
      type: "input",
      name: "appId",
      message: "Enter the application ID:",
      validate: (input) => {
        if (isNaN(Number(input))) {
          return "Please enter a valid number";
        }
        return true;
      },
    },
  ]);

  const appId = parseInt(res.appId);
  if (isNaN(appId)) {
    logger.error("Please enter a valid number");
    return getAppId();
  }
  return appId;
};

export const selectApp = async (apps: any[]): Promise<string> => {
  // Format apps for display
  const choices = apps.map((app, index) => ({
    name: `${app.name} (${formatAppId(app.id)})`,
    value: app.id,
  }));

  const res = await enquirer.prompt<{ selectedApp: string }>([
    {
      type: "select",
      name: "selectedApp",
      message: "Select an app:",
      choices: choices,
    },
  ]);

  // Find the selected app and return its value
  const selectedChoice = choices.find(
    (choice) => choice.name === res.selectedApp
  );
  return selectedChoice ? selectedChoice.value : res.selectedApp;
};

// Helper function to format app ID
const formatAppId = (id: string | number): string => {
  const idString = id.toString();
  if (idString.length <= 8) return idString;
  return `${idString.slice(0, 6)}...${idString.slice(-8)}`;
};

import enquirer from "enquirer";
import { logger } from "./Logger";

type AmountOfAccountsResponse = {
  amount: string;
};

type ConfirmationResponse = {
  answer: "No" | "Yes";
};

export const getAmountOfAccounts = async (): Promise<number> => {
  const res = await enquirer.prompt<AmountOfAccountsResponse>([
    {
      type: "input",
      name: "amount",
      message: "How many accounts do you want to distribute to?",
      validate: (input) => {
        if (isNaN(Number(input))) {
          return "Please enter a valid number";
        }
        return true;
      },
    },
  ]);

  const amountOfAccounts = parseInt(res.amount);
  if (isNaN(amountOfAccounts)) {
    logger.error("Please enter a valid gas price coefficient");
    return getAmountOfAccounts();
  }
  return amountOfAccounts;
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

export const confirmVot3Swap = async (): Promise<boolean> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `Proceed with swapping B3TR for VOT3 on the root account?`,
      choices: ["No", "Yes"],
    },
  ]);

  return res.answer === "Yes";
};

export const confirmVot3Distribution = async (): Promise<boolean> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `Proceed with distributing VOT3 to the other addresses?`,
      choices: ["No", "Yes"],
    },
  ]);

  return res.answer === "Yes";
};

export const confirmVoteRound = async (): Promise<boolean> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `Proceed with equaly voting for apps in this round?`,
      choices: ["No", "Yes"],
    },
  ]);

  return res.answer === "Yes";
};

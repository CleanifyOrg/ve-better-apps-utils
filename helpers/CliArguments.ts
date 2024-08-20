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
      message: "How many accounts do you want to use?",
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
    logger.error("Please enter a valid number");
    return getAmountOfAccounts();
  }
  return amountOfAccounts;
};

export const getStartIndex = async (): Promise<number> => {
  const res = await enquirer.prompt<AmountOfAccountsResponse>([
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

export const getProposalId = async (): Promise<string> => {
  const res = await enquirer.prompt<{ proposalId: string }>([
    {
      type: "input",
      name: "proposalId",
      message: "Enter the id of the proposal you want to vote on",
    },
  ]);

  return res.proposalId;
};

export const getVoteType = async (): Promise<number> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `What do you want to vote for?`,
      choices: ["No", "Yes", "Abstain"],
    },
  ]);

  if (res.answer === "No") {
    return 0;
  }

  if (res.answer === "Yes") {
    return 1;
  }

  if (res.answer === "Abstain") {
    return 2;
  }

  throw new Error("Invalid vote type");
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

export const confirmVoteWithRootSigner = async (): Promise<boolean> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `Proceed with voting with the root signer?`,
      choices: ["No", "Yes"],
    },
  ]);

  return res.answer === "Yes";
};

export const confirmVoteForProposal = async (): Promise<boolean> => {
  const res = await enquirer.prompt<ConfirmationResponse>([
    {
      type: "select",
      name: "answer",
      message: `Proceed with voting for the proposal?`,
      choices: ["No", "Yes"],
    },
  ]);

  return res.answer === "Yes";
};

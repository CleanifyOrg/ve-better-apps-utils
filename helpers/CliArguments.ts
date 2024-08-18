import enquirer from "enquirer";
import { logger } from "./Logger";

type AmountOfAccountsResponse = {
  amount: string;
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

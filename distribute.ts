import { getAmountOfAccounts } from "./helpers/CliArguments";

const Addresses = {
  b3tr: "0x5ef79995FE8a89e0812330E4378eB2660ceDe699",
  vot3: "0x76Ca782B59C74d088C7D2Cce2f211BC00836c602",
  rewarder: "0x838A33AF756a6366f93e201423E1425f67eC0Fa7",
  gov: "0x89A00Bb0947a30FF95BEeF77a66AEdE3842Fe5B7",
  nft: "0x93B8cD34A7Fc4f53271b9011161F7A2B5fEA9D1F",
};

const appIds = [
  "0x2fc30c2ad41a2994061efaf218f1d52dc92bc4a31a0f02a4916490076a7a393a",
  "0x6c977a18d427360e27c3fc2129a6942acd4ece2c8aaeaf4690034931dc5ba7f9",
  "0x74133534672eca50a67f8b20bf17dd731b70d83f0a12e3500fca0793fca51c7d",
  "0x821a9ae30590c7c11e0ebc03b27902e8cae0f320ad27b0f5bde9f100eebcb5a7",
  "0x899de0d0f0b39e484c8835b2369194c4c102b230c813862db383d44a4efe14d3",
  "0x9643ed1637948cc571b23f836ade2bdb104de88e627fa6e8e3ffef1ee5a1739a",
  "0xa30ddd53895674f3517ed4eb8f7261a4287ec1285fdd13b1c19a1d7009e5b7e3",
  "0xcd9f16381818b575a55661602638102b2b8497a202bb2497bb2a3a2cd438e85d",
];

async function main() {
  const amountOfAccounts = await getAmountOfAccounts();
}

// Execute the main function
main();

import { AppConfig } from "./index";
//TODO: add dev-testnet addresses
const config: AppConfig = {
  environment: "testnet",
  b3trContractAddress: "0x5ef79995FE8a89e0812330E4378eB2660ceDe699",
  vot3ContractAddress: "0x76Ca782B59C74d088C7D2Cce2f211BC00836c602",
  b3trGovernorAddress: "0x1c65C25fABe2fc1bCb82f253fA0C916a322f777C",
  timelockContractAddress: "0x7B7EaF620d88E38782c6491D7Ce0B8D8cF3227e4",
  xAllocationPoolContractAddress: "0x4191776F05f4bE4848d3f4d587345078B439C7d3",
  xAllocationVotingContractAddress:
    "0x89A00Bb0947a30FF95BEeF77a66AEdE3842Fe5B7",
  emissionsContractAddress: "0xDf94739bd169C84fe6478D8420Bb807F1f47b135",
  voterRewardsContractAddress: "0x838A33AF756a6366f93e201423E1425f67eC0Fa7",
  galaxyMemberContractAddress: "0x93B8cD34A7Fc4f53271b9011161F7A2B5fEA9D1F",
  treasuryContractAddress: "0xD5903BCc66e439c753e525F8AF2FeC7be2429593",
  x2EarnAppsContractAddress: "0x8392B7CCc763dB03b47afcD8E8f5e24F9cf0554D",
  x2EarnRewardsPoolContractAddress:
    "0x6Bee7DDab6c99d5B2Af0554EaEA484CE18F52631",
  x2EarnCreatorContractAddress: "0xe8e96a768ffd00417d4bd985bec9EcfC6F732a7f",
  nodeManagementContractAddress: "0xB0EF9D89C6b49CbA6BBF86Bf2FDf0Eee4968c6AB",
  veBetterPassportContractAddress: "0x35a267671d8EDD607B2056A9a13E7ba7CF53c8b3",
  nodeUrl: "https://testnet.vechain.org",
};
export default config;

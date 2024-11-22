import { ThorClient } from "@vechain/sdk-network";
import { abi, unitsUtils } from "@vechain/sdk-core";

// B3TR token contract address (replace with actual address)
const B3TR_CONTRACT_ADDRESS = "0x5ef79995FE8a89e0812330E4378eB2660ceDe699";

// Define the Transfer event ABI
const transferEvent = new abi.Event(
  "event Transfer(address indexed from, address indexed to, uint256 value)"
);

// Specific sender and receiver addresses
const SENDER_ADDRESS = "0xbfE2122a82C0AEa091514f57C7713C3118101eDa";
const RECEIVER_ADDRESS = "0x706f98d4e2afe673052bdee4797883d6ff464b61";

const encodedTopics = transferEvent.encodeFilterTopics([
  SENDER_ADDRESS,
  RECEIVER_ADDRESS,
]);

async function main() {
  // Initialize Thor client (replace with appropriate network URL)
  const thorClient = ThorClient.fromUrl("https://mainnet.vechain.org");

  // Filter the Transfer events
  const filteredLogs = await thorClient.logs.filterRawEventLogs({
    criteriaSet: [
      // filter by address and topics, empty topics are ignored
      {
        address: B3TR_CONTRACT_ADDRESS,
        topic0: encodedTopics[0],
        topic1: encodedTopics[1],
        topic2: encodedTopics[2],
        topic3: encodedTopics[3],
        topic4: encodedTopics[4],
      },
    ],
  });

  let totalAmount = BigInt(0);
  // Process the logs
  const decodedLogs = filteredLogs.map((log) => {
    const decodedLog = transferEvent.decodeEventLog(log);

    totalAmount += decodedLog[2];
  });

  console.log(unitsUtils.formatVET(totalAmount), "B3TR");
}

main();

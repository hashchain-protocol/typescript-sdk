import { HashchainProtocol } from "../src/protocol";
import { hashchain, decodeContractError } from "../src/utils";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";

dotenv.config();

// --- ENVIRONMENT SETUP ---
const requiredEnvs = [
  "CITREA_RPC_URL",
  "PRIVATE_KEY",
  "CITREA_CONTRACT_ADDRESS",
];
for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
    process.exit(1);
  }
}
const RPC_URL = process.env.CITREA_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CITREA_CONTRACT_ADDRESS!;

// --- PROVIDER, WALLET, CONTRACT, SDK ---
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, HashchainProtocolABI, wallet);
const hashchainSDK = new HashchainProtocol(provider, CONTRACT_ADDRESS, wallet);

// --- EVENT LOGGING ---
function parseRedeemEvents(receipt: ethers.providers.TransactionReceipt) {
  let redeemed = false;
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog?.name === "ChannelRedeemed") {
        redeemed = true;
        console.log("✅ Channel Redeemed!");
        console.table({
          Payer: parsedLog.args.payer,
          Merchant: parsedLog.args.merchant,
          Amount: ethers.utils.formatEther(parsedLog.args.amountPaid),
        });
      }
      if (parsedLog?.name === "ChannelRefunded") {
        console.log("💸 Channel Refunded!");
        console.table({
          Payer: parsedLog.args.payer,
          Refund: ethers.utils.formatEther(parsedLog.args.refundAmount),
        });
      }
    } catch {
      // Ignore non-matching logs
    }
  }
  if (!redeemed) {
    console.warn("⚠️ ChannelRedeemed event not found in transaction logs.");
  }
}

// --- MAIN TEST FUNCTION ---
async function testRedeemChannel(tokenAddress: string) {
  try {
    console.log("🔓 Redeeming payment channel...");

    // Parameters: demo values; adapt as needed
    const payer = "0x1bB38d9F94804A36EEE5FB8e18D012B5Aa687563";
    const numberOfTokens = 9000;
    const hashchainArray = hashchain("initial-seed", numberOfTokens);
    const numberOfTokensUsed = 8000;
    const finalHashValue = hashchainArray[1000];

    const tx = await hashchainSDK.redeemChannel({
      payer,
      tokenAddress,
      finalHashValue,
      numberOfTokensUsed,
    });

    console.log("⏳ Waiting for transaction confirmation:", tx.hash);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

    parseRedeemEvents(receipt);

  } catch (error: any) {
    console.error("❌ Error redeeming channel.");
    const decoded = decodeContractError(error, HashchainProtocolABI);
    if (decoded) {
      console.error(`Smart Contract Error: ${decoded.errorName}\n`, decoded);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ""; // Optional; empty means native

  // Determine if native or ERC20
  const tokenOrNativeAddress =
    !TOKEN_ADDRESS || TOKEN_ADDRESS === "0"
      ? ethers.constants.AddressZero
      : TOKEN_ADDRESS;

  testRedeemChannel(tokenOrNativeAddress);
}

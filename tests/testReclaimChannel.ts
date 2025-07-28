import { HashchainProtocol } from "../src/protocol";
import { decodeContractError } from "../src/utils";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";

dotenv.config();

// --- ENVIRONMENT CHECK ---
const requiredEnvs = [
  "CITREA_RPC_URL",
  "PRIVATE_KEY",
  "CITREA_CONTRACT_ADDRESS",
  "MERCHANT_ADDRESS"
];
for (const env of requiredEnvs) {
  if (!process.env[env]) {
    console.error(`❌ Missing environment variable: ${env}`);
    process.exit(1);
  }
}

const CITREA_RPC_URL = process.env.CITREA_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CITREA_CONTRACT_ADDRESS!;
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS!;

// --- SETUP ---
const provider = new ethers.providers.JsonRpcProvider(CITREA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const hashchainSDK = new HashchainProtocol(provider, CONTRACT_ADDRESS, wallet);


// --- RECLAIM FUNCTION ---
const testReclaimChannel = async (address: string) => {
  try {
    console.log(
      `🔄 Reclaiming a payment channel using ${address === ethers.constants.AddressZero ? "native currency" : address
      }...`
    );

    const tx = await hashchainSDK.reclaimChannel({ merchant: MERCHANT_ADDRESS, tokenAddress: address });
    console.log("⏳ Waiting for transaction confirmation:", tx.hash);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
  } catch (err: any) {
    console.error("❌ Error reclaiming channel.");
    const decoded = decodeContractError(err, HashchainProtocolABI);
    if (decoded) {
      console.error(`Smart Contract Error: ${decoded.errorName}\n`, decoded);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
};

const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ""; // Optional; empty means native

// Determine if native or ERC20
const tokenOrNativeAddress =
  !TOKEN_ADDRESS || TOKEN_ADDRESS === "0"
    ? ethers.constants.AddressZero
    : TOKEN_ADDRESS;

// --- EXECUTE ---
testReclaimChannel(tokenOrNativeAddress);

import { HashchainProtocol } from "../src/protocol";
import { hashchain, decodeContractError } from "../src/utils";
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";

dotenv.config();

/** --- ENVIRONMENT & CONSTANTS --- **/
const requiredEnvs = [
  "CITREA_RPC_URL",
  "PRIVATE_KEY",
  "CITREA_CONTRACT_ADDRESS",
  "MERCHANT_ADDRESS",
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
const MERCHANT_ADDRESS = process.env.MERCHANT_ADDRESS!;

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, HashchainProtocolABI, wallet);
const hashchainSDK = new HashchainProtocol(provider, CONTRACT_ADDRESS, wallet);


/** --- HELPERS --- **/

// Print out parsed ChannelCreated event
function printChannelEvent(parsedLog: any) {
  console.log("🎉 Channel Created!");
  console.table({
    Payer: parsedLog.args.payer,
    Merchant: parsedLog.args.merchant,
    Token: parsedLog.args.token,
    Amount: ethers.utils.formatEther(parsedLog.args.amount),
    Tokens: parsedLog.args.numberOfTokens.toString(),
  });
}

// Find and print ChannelCreated event from tx receipt
function parseChannelCreatedEvent(receipt: ethers.providers.TransactionReceipt) {
  let eventFound = false;
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog?.name === "ChannelCreated") {
        eventFound = true;
        printChannelEvent(parsedLog);
      }
    } catch {
      // Ignore non-matching logs
    }
  }
  if (!eventFound) {
    console.warn("⚠️ ChannelCreated event not found in transaction logs.");
  }
}

// Generate trust anchor from hashchain
function getTrustAnchor(seed: string, numTokens: number): string {
  const hashchainArray = hashchain(seed, numTokens);
  return hashchainArray[hashchainArray.length - 1];
}

/** --- MAIN FUNCTION --- **/

async function testCreateChannel(tokenAddress: string) {
  try {
    const merchant = MERCHANT_ADDRESS;
    const numberOfTokens = 9000;
    const amount = ethers.utils.parseEther("0.0001");
    const hashSeed = "initial-seed";
    const trustAnchor = getTrustAnchor(hashSeed, numberOfTokens);

    console.log("🚀 Initiating payment channel creation...");
    console.log("🔑 Trust anchor:", trustAnchor);

    // Approve ERC20 if needed
    if (tokenAddress !== ethers.constants.AddressZero) {
      const allowance = await hashchainSDK.checkAllowance(tokenAddress);
      if (allowance.lt(amount)) {
        console.log("🔓 Approving token...");
        const approveTx = await hashchainSDK.approve(tokenAddress, amount);
        console.log("🔃 Waiting for approval confirmation:", approveTx.hash);
        await approveTx.wait();
        console.log("✅ Approval confirmed.");
      } else {
        console.log("✅ Sufficient allowance already approved.");
      }
    }

    // Create channel
    console.log("📦 Creating payment channel...");
    const tx = await hashchainSDK.createChannel({
      merchant,
      tokenAddress,
      trustAnchor,
      amount,
      numberOfTokens,
      merchantWithdrawAfterBlocks: 1,
      payerWithdrawAfterBlocks: 1,
    });

    console.log("⏳ Waiting for transaction confirmation:", tx.hash);
    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
    parseChannelCreatedEvent(receipt);

  } catch (error: any) {
    console.error("❌ Error creating channel");
    const decoded = decodeContractError(error, HashchainProtocolABI);
    if (decoded) {
      console.error(`Smart Contract Error: ${decoded.errorName}\n`, decoded);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

/** --- RUN IF MAIN --- **/

if (require.main === module) {
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || ""; // Optional; empty means native

  // Determine if native or ERC20
  const tokenOrNativeAddress =
    !TOKEN_ADDRESS || TOKEN_ADDRESS === "0"
      ? ethers.constants.AddressZero
      : TOKEN_ADDRESS;
  testCreateChannel(tokenOrNativeAddress);
}

import readline from "readline";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { HashchainProtocol } from "./protocol";
import { hashchain } from "./utils";

dotenv.config();

const CITREA_RPC_URL = process.env.CITREA_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

const provider = new ethers.providers.JsonRpcProvider(CITREA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const hashchainSDK = new HashchainProtocol(provider, CONTRACT_ADDRESS, wallet);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const createChannel = async () => {
  try {
    console.log("\n🚀 Creating a payment channel...");

    // const payer = await askQuestion("Enter payer address: ");
    const merchant = await askQuestion("Enter merchant address: ");
    const amountInput = await askQuestion("Enter amount in ETH: ");
    const numberOfTokensInput = await askQuestion("Enter number of tokens: ");
    const merchantWithdrawAfterBlocksInput = await askQuestion(
      "Merchant withdraw after blocks: "
    );
    const payerWithdrawAfterBlocksInput = await askQuestion(
      "Payer withdraw after blocks: "
    );

    const amount = ethers.utils.parseEther(amountInput);
    const numberOfTokens = parseInt(numberOfTokensInput, 10);
    const merchantWithdrawAfterBlocks = parseInt(
      merchantWithdrawAfterBlocksInput,
      10
    );
    const payerWithdrawAfterBlocks = parseInt(
      payerWithdrawAfterBlocksInput,
      10
    );

    // Generate hashchain
    const hashchainArray = hashchain("initial-seed", numberOfTokens);
    const trustAnchor = hashchainArray[hashchainArray.length - 1];

    const tx = await hashchainSDK.createChannel(
      merchant,
      trustAnchor,
      amount,
      numberOfTokens,
      merchantWithdrawAfterBlocks,
      payerWithdrawAfterBlocks,
      { value: amount }
    );

    console.log("\n📤 Transaction sent! Hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  } catch (error: any) {
    console.error("❌ Error creating channel:", error.message);
  } finally {
    rl.close();
  }
};

const redeemChannel = async () => {
  try {
    console.log("\n Redeeming payment channel...");

    const payer = await askQuestion("Enter payer address: ");
    //   const merchant = await askQuestion("Enter merchant address: ");
    //   const amountInput = await askQuestion("Enter amount in ETH: ");
    const finalHashValue = await askQuestion(
      "Enter final hash value received: "
    );
    const numberOfTokensInput = await askQuestion(
      "Enter number of used tokens: "
    );

    const tx = await hashchainSDK.redeemChannel(
      payer,
      finalHashValue,
      numberOfTokensInput
    );

    console.log("\n📤 Transaction sent! Hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  } catch (error: any) {
    console.error("❌ Error redeeming channel:", error.message);
  } finally {
    rl.close();
  }
};

const reclaimChannel = async () => {
  try {
    console.log("Reclaiming payment channel...");

    const merchant = await askQuestion("Enter merchant address: ");
    const tx = await hashchainSDK.reclaimChannel(merchant);

    console.log("\n📤 Transaction sent! Hash:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
  } catch (error: any) {
    console.log("❌ Error redeeming channel:", error.message);
  } finally {
    rl.close();
  }
};

const main = async () => {
  console.log("\n⚡ Hashchain CLI - Test SDK");
  console.log("1: Create Channel");
  console.log("2: Redeem Channel");
  console.log("3: Reclaim Channel");

  rl.question("Enter your choice: ", async (choice) => {
    switch (choice) {
      case "1":
        await createChannel();
        break;
      case "2":
        await redeemChannel();
        break;
      case "3":
        await reclaimChannel();
        break;
      default:
        console.log("Invalid choice. Please enter 1, 2, or 3.");
    }
    rl.close();
  });
  //   await createChannel();
  //   await redeemChannel();
  // await reclaimChannel();
};

main();

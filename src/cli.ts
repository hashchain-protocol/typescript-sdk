#!/usr/bin/env ts-node

import readline from "readline";
import { ethers } from "ethers";
import dotenv from "dotenv";
import { HashchainProtocol } from "./protocol";
import { hashchain } from "./utils";

dotenv.config();

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`❌ Missing environment variable: ${name}`);
  }
  return value;
}

const CITREA_RPC_URL = getEnvVar("CITREA_RPC_URL");
const PRIVATE_KEY = getEnvVar("PRIVATE_KEY");
const CONTRACT_ADDRESS = getEnvVar("CONTRACT_ADDRESS");

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

function validateAddress(name: string, value: string) {
  if (!ethers.utils.isAddress(value)) {
    throw new Error(`❌ ${name} is not a valid address.`);
  }

  if (value === ethers.constants.AddressZero) {
    throw new Error(`❌ ${name} cannot be the zero address.`);
  }
}

function validateTokenAddress(name: string, value: string) {
  if (value === ethers.constants.AddressZero) {
    // Zero address is allowed for native token
    return;
  }

  if (!ethers.utils.isAddress(value)) {
    throw new Error(`❌ ${name} is not a valid Ethereum address.`);
  }
}

const createChannel = async () => {
  try {
    console.log("\n🚀 Creating a payment channel...");

    // const payer = await askQuestion("Enter payer address: ");
    const merchant = await askQuestion("Enter merchant address: ");
    validateAddress("Merchant", merchant);
    const tokenAddress = await askQuestion("Enter token address: ");
    validateTokenAddress("Token", tokenAddress);
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
    let tx;
    if (tokenAddress === ethers.constants.AddressZero) {
      tx = await hashchainSDK.createChannel({
        merchant,
        tokenAddress,
        trustAnchor,
        amount,
        numberOfTokens,
        merchantWithdrawAfterBlocks,
        payerWithdrawAfterBlocks,
        overrides: { value: amount },
      });
    } else {
      tx = await hashchainSDK.createChannel({
        merchant,
        tokenAddress,
        trustAnchor,
        amount,
        numberOfTokens,
        merchantWithdrawAfterBlocks,
        payerWithdrawAfterBlocks,
      });
    }

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
    validateAddress("Payer", payer);
    const tokenAddress = await askQuestion("Enter token address: ");
    validateTokenAddress("Token", tokenAddress);
    const finalHashValue = await askQuestion(
      "Enter final hash value received: "
    );
    const numberOfTokensInput = await askQuestion(
      "Enter number of used tokens: "
    );
    const numberOfTokensUsed = parseInt(numberOfTokensInput, 10);

    const tx = await hashchainSDK.redeemChannel({
      payer,
      tokenAddress,
      finalHashValue,
      numberOfTokensUsed,
    });

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
    validateAddress("Merchant", merchant);
    const tokenAddress = await askQuestion("Enter token address: ");
    validateTokenAddress("Token", tokenAddress);
    const tx = await hashchainSDK.reclaimChannel({ merchant, tokenAddress });

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
  console.log("0: Exit");

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
      case "0":
        console.log("👋 Exiting...");
        return;
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

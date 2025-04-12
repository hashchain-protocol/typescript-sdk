# ⚡ Hashchain Protocol SDK

The Hashchain Protocol SDK enables developers to create and interact with on-chain payment channels using a hashchain-based commitment mechanism. Ideal for pay-per-use systems, streaming payments, or microtransactions.

## ✨ Features

- Create secure payment channels with native tokens or ERC-20
- Redeem payments using hash-based tokens
- Reclaim unused funds after channel timeout
- Generate and verify hashchains
- Decode smart contract errors for better debugging
- Utility methods for ETH/Wei conversions and secure randomness

## 📦 Installation

```bash
npm install @hashchain/sdk
```

## Prerequisites

1. Ensure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
2. Ensure your .env file is set up with the following variables:
   - `RPC_URL`=<your_rpc_url>
   - `PRIVATE_KEY`=<payer_private_key>
   - `CONTRACT_ADDRESS`=<deployed_hashchain_contract>

## 🚀 Quick Start Example

```javascript
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import {
  HashchainProtocol,
  decodeContractError,
  HashchainProtocolABI,
} from "@hashchain/sdk";

// Load environment variables from .env file
dotenv.config();

// Load environment variables from .env file
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS!;

// Ensure environment variables are set
if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  throw new Error("Missing required environment variables.");
}

// Initialize Ethereum provider and wallet
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Initialize the Hashchain SDK
const hashchainSDK = new HashchainProtocol(provider, CONTRACT_ADDRESS, wallet);

const createChannel = async ({
  merchant,
  tokenAddress = ethers.constants.AddressZero,
  trustAnchor,
  amount,
  numberOfTokens,
  merchantWithdrawAfterBlocks = 1,
  payerWithdrawAfterBlocks = 1,
}: {
  merchant: string;
  tokenAddress?: string;
  amount: ethers.BigNumber;
  trustAnchor: string;
  numberOfTokens: number;
  merchantWithdrawAfterBlocks?: number;
  payerWithdrawAfterBlocks?: number;
}) => {
  try {
    console.log("Creating a payment channel...");

    const tx = await hashchainSDK.createChannel({
      merchant,
      tokenAddress,
      trustAnchor,
      amount,
      numberOfTokens,
      merchantWithdrawAfterBlocks,
      payerWithdrawAfterBlocks,
    });

    console.log("Transaction sent! Hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error: any) {
    console.error("❌ Error creating channel");
    decodeContractError(error, HashchainProtocolABI);
  }
};

const redeemChannel = async ({
  payer,
  tokenAddress = ethers.constants.AddressZero,
  finalHashValue,
  numberOfTokensUsed,
}: {
  payer: string;
  tokenAddress?: string;
  finalHashValue: string;
  numberOfTokensUsed: number;
}) => {
  try {
    console.log("Redeeming a payment channel...");

    const tx = await hashchainSDK.redeemChannel({
      payer,
      tokenAddress,
      finalHashValue,
      numberOfTokensUsed,
    });

    console.log("Transaction sent! Hash:", tx.hash);

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
  } catch (error: any) {
    console.error("❌ Error redeeming channel");
    decodeContractError(error, HashchainProtocolABI);
  }
};

const main = async () => {
  // Demo addresses and values (replace with actual values in real usage)
  let merchant = "0x1bB38d9F94804A36EEE5FB8e18D012B5Aa687563";
  let tokenAddress = "0x8d0c9d1c17aE5e40ffF9bE350f57840E9E66Cd93"; // ERC-20 token (or AddressZero for ETH)
  let trustAnchor =
    "0x2b1947b36fe6950873690e63efad65293ad2369b0331b9f0d8643adc525738f6";
  let numberOfTokens = 9000;
  let amount = ethers.utils.parseEther("0.01"); // 0.01 token (ETH or ERC-20)

  let payer = "0x1bB38d9F94804A36EEE5FB8e18D012B5Aa687563";
  let finalHashValue =
    "0x766418c7e06d5661b1395effb4e17804a12e43be5a92b7226fcde8827d445765"; // Last revealed token by payer
  let numberOfTokensUsed = 8950;

  // If using an ERC-20 token, ensure that you have granted approval to the contract address
  // for the required amount before initiating the transaction.

  // Create a channel
  await createChannel({
    merchant: merchant,
    tokenAddress: tokenAddress,
    trustAnchor: trustAnchor,
    amount: amount,
    numberOfTokens: numberOfTokens,
  });

  // Redeem channel
  await redeemChannel({
    payer: payer,
    tokenAddress: tokenAddress,
    finalHashValue: finalHashValue,
    numberOfTokensUsed: numberOfTokensUsed,
  });
};

main();

```

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

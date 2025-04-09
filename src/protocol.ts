import { ethers } from "ethers";
import { hashchain, decodeContractError } from "./utils";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";
import {
  CreateChannelParams,
  RedeemChannelParams,
  ReclaimChannelParams,
} from "./types/channel";

export class HashchainProtocol {
  private contract: ethers.Contract;
  private signer: ethers.Signer;

  constructor(
    provider: ethers.providers.Provider,
    contractAddress: string,
    signer?: ethers.Signer
  ) {
    this.contract = new ethers.Contract(
      contractAddress,
      HashchainProtocolABI,
      provider
    );
    if (signer || (provider as ethers.providers.JsonRpcProvider).getSigner) {
      this.signer =
        signer || (provider as ethers.providers.JsonRpcProvider).getSigner();
      this.contract = this.contract.connect(this.signer);
    }
  }

  // private async sendTransaction<T>(method: () => Promise<T>): Promise<T> {
  //   try {
  //     return await method();
  //   } catch (error: any) {
  //     const decodedError = decodeContractError(error, HashchainProtocolABI);
  //     throw new Error(
  //       `Contract Error: ${decodedError?.errorName || "Unknown"} `
  //     );
  //   }
  // }

  /**
   * Creates a new payment channel between a payer and a merchant.
   *
   * @param params - Parameters required to create a new channel
   * @param params.merchant - The merchant receiving payments.
   * @param params.token - The ERC-20 token address used for payments, or `ethers.constants.AddressZero` to use the native currency (ETH).
   * @param params.trustAnchor - The final hash value of the hashchain.
   * @param params.amount - The total deposit amount for the channel.
   * @param params.numberOfTokens - The number of tokens in the hashchain.
   * @param params.merchantWithdrawAfterBlocks - Block number after which the merchant can withdraw. Default is 1000.
   * @param params.payerWithdrawAfterBlocks - Block number after which the payer can reclaim unused funds. Default is 2000.
   * @param params.overrides - Optional transaction overrides (e.g., gas, value).
   */
  async createChannel(
    params: CreateChannelParams
  ): Promise<ethers.providers.TransactionResponse> {
    const {
      merchant,
      token,
      trustAnchor,
      amount,
      numberOfTokens,
      merchantWithdrawAfterBlocks = 1000,
      payerWithdrawAfterBlocks = 2000,
      overrides = {},
    } = params;

    if (!this.signer) throw new Error("Signer required to send transactions");

    // Handle native vs token logic here
    const isNative = token === ethers.constants.AddressZero;
    const txOverrides = isNative ? { ...overrides, value: amount } : overrides;

    try {
      return await this.contract.createChannel(
        merchant,
        token,
        trustAnchor,
        amount,
        numberOfTokens,
        merchantWithdrawAfterBlocks,
        payerWithdrawAfterBlocks,
        txOverrides
      );
    } catch (error: any) {
      const decodedError = decodeContractError(error, HashchainProtocolABI);
      throw new Error(
        `Contract Error: ${decodedError?.errorName || "Unknown"} `
      );
    }
  }

  // async createChannel(
  //   ...params
  // ): Promise<ethers.providers.TransactionResponse> {
  //   if (!this.signer) throw new Error("Signer required to send transactions");
  //   return this.sendTransaction(() => this.contract.createChannel(...params));
  // }

  /**
   * Redeems a payment channel by verifying the final hash value.
   *
   * @param params - Parameters required to redeem the channel
   * @param params.payer - The address of the payer.
   * @param params.token - The ERC-20 token address used for payments, or `ethers.constants.AddressZero` to use the native currency (ETH).
   * @param params.finalHashValue - The final hash value after consuming tokens.
   * @param params.numberOfTokensUsed - The number of tokens used during the transaction.
   */
  async redeemChannel(
    params: RedeemChannelParams
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const { payer, token, finalHashValue, numberOfTokensUsed } = params;
      return await this.contract.redeemChannel(
        payer,
        token,
        finalHashValue,
        numberOfTokensUsed
      );
    } catch (error: any) {
      const decodedError = decodeContractError(error, HashchainProtocolABI);
      throw new Error(
        `Contract Error: ${decodedError?.errorName || "Unknown"} `
      );
    }
  }

  // async redeemChannel(
  //   ...params
  // ): Promise<ethers.providers.TransactionResponse> {
  //   return this.sendTransaction(() => this.contract.redeemChannel(...params));
  // }

  /**
   * Allows the payer to reclaim their deposit after the withdrawal period expires.
   *
   * @param params - Parameters required to reclaim the channel funds
   * @param params.merchant - The address of the merchant.
   * @param params.token - The ERC-20 token address used for payments, or `ethers.constants.AddressZero` to use the native currency (ETH).
   */
  async reclaimChannel(
    params: ReclaimChannelParams
  ): Promise<ethers.providers.TransactionResponse> {
    try {
      const { merchant, token } = params;
      return await this.contract.reclaimChannel(merchant, token);
    } catch (error: any) {
      const decodedError = decodeContractError(error, HashchainProtocolABI);
      throw new Error(
        `Contract Error: ${decodedError?.errorName || "Unknown"} `
      );
    }
  }

  // async reclaimChannel(
  //   ...params
  // ): Promise<ethers.providers.TransactionResponse> {
  //   return this.sendTransaction(() => this.contract.reclaimChannel(...params));
  // }

  async verifyHashchain(
    trustAnchor: string,
    finalHashValue: string,
    numberOfTokensUsed: number
  ): Promise<boolean> {
    return (
      await this.contract,
      this.verifyHashchain(trustAnchor, finalHashValue, numberOfTokensUsed)
    );
  }

  async getChannel(payer: string, merchant: string, token: string) {
    return await this.contract.channelsMapping(payer, merchant, token);
  }
}

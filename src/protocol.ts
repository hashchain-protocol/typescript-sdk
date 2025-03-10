import { ethers } from "ethers";
import { hashchain, decodeContractError } from "./utils";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";

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
      this.contract = this.contract.connect(signer);
    }
  }

  private async sendTransaction<T>(method: () => Promise<T>): Promise<T> {
    try {
      return await method();
    } catch (error: any) {
      const decodedError = decodeContractError(error, HashchainProtocolABI);
      throw new Error(
        `Contract Error: ${decodedError?.errorName || "Unknown"} `
      );
    }
  }

  // async createChannel (
  //     merchant: string,
  //     trustAnchor: string,
  //     amount: ethers.BigNumberish,
  //     numberOfTokens: number,
  //     merchantWithdrawAfterBlocks?: number,
  //     payerWithdrawAfterBlocks?: number,
  //     overrides: ethers.PayableOverrides = {}
  // ) : Promise<ethers.providers.TransactionResponse> {
  //     if (!this.signer) throw new Error("Signer required to send transactions");

  //     // Assign default values if they are not provided
  //     merchantWithdrawAfterBlocks = merchantWithdrawAfterBlocks ?? 1000;
  //     payerWithdrawAfterBlocks = payerWithdrawAfterBlocks ?? 2000;

  //     try {
  //         return await this.contract.createChannel(merchant, trustAnchor, amount, numberOfTokens, merchantWithdrawAfterBlocks, payerWithdrawAfterBlocks, { value: amount });
  //     } catch (error: any) {
  //         const decodedError = decodeContractError(error, HashchainProtocolABI);
  //         throw new Error(`Contract Error: ${decodedError?.errorName || "Unknown"} `);
  //     }
  // }

  // async redeemChannel (
  //     payer: string,
  //     finalHashValue: string,
  //     numberOfTokensUsed: number
  // ) : Promise<ethers.providers.TransactionResponse> {
  //     try {
  //         return await this.contract.redeemChannel(payer, finalHashValue, numberOfTokensUsed);
  //     } catch (error: any) {
  //         const decodedError = decodeContractError(error, HashchainProtocolABI);
  //         throw new Error(`Contract Error: ${decodedError?.errorName || "Unknown"} `);
  //     }

  // }

  async createChannel(
    ...params
  ): Promise<ethers.providers.TransactionResponse> {
    if (!this.signer) throw new Error("Signer required to send transactions");
    return this.sendTransaction(() => this.contract.createChannel(...params));
  }

  async redeemChannel(
    ...params
  ): Promise<ethers.providers.TransactionResponse> {
    return this.sendTransaction(() => this.contract.redeemChannel(...params));
  }

  // async reclaimChannel (
  //     merchant: string
  // ) : Promise<ethers.providers.TransactionResponse> {
  //     try {
  //         return await this.contract.reclaimChannel(merchant);
  //     } catch (error: any) {
  //         const decodedError = decodeContractError(error, HashchainProtocolABI);
  //         throw new Error(`Contract Error: ${decodedError?.errorName || "Unknown"} `);
  //     }
  // }

  async reclaimChannel(
    ...params
  ): Promise<ethers.providers.TransactionResponse> {
    return this.sendTransaction(() => this.contract.reclaimChannel(...params));
  }

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

  async getChannel(payer: string, merchant: string) {
    return await this.contract.channelsMapping(payer, merchant);
  }
}

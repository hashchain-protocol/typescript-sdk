import { BigNumberish, PayableOverrides } from "ethers";

export interface CreateChannelParams {
  merchant: string;
  tokenAddress: string;
  trustAnchor: string;
  amount: BigNumberish;
  numberOfTokens: number;
  merchantWithdrawAfterBlocks?: number;
  payerWithdrawAfterBlocks?: number;
  overrides?: PayableOverrides;
}

export interface RedeemChannelParams {
  payer: string;
  tokenAddress: string;
  finalHashValue: string;
  numberOfTokensUsed: number;
}

export interface ReclaimChannelParams {
  merchant: string;
  tokenAddress: string;
}

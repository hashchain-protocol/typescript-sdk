import { BigNumberish, PayableOverrides } from "ethers";

export interface CreateChannelParams {
  merchant: string;
  token: string;
  trustAnchor: string;
  amount: BigNumberish;
  numberOfTokens: number;
  merchantWithdrawAfterBlocks?: number;
  payerWithdrawAfterBlocks?: number;
  overrides?: PayableOverrides;
}

export interface RedeemChannelParams {
  payer: string;
  token: string;
  finalHashValue: string;
  numberOfTokensUsed: number;
}

export interface ReclaimChannelParams {
  merchant: string;
  token: string;
}

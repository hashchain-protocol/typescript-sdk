import { HashchainProtocol } from "./hashchainProtocol";
import {
  CreateChannelParams,
  RedeemChannelParams,
  ReclaimChannelParams,
} from "./types/hashchainChannel";
import {
  hashchain,
  generateSeed,
  toWei,
  fromWei,
  decodeContractError,
  getTokenAllowance,
  approveToken,
  verifyHashchainToken
} from "./utils";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";

export {
  HashchainProtocol,
  hashchain,
  generateSeed,
  toWei,
  fromWei,
  decodeContractError,
  getTokenAllowance,
  approveToken,
  verifyHashchainToken,
  CreateChannelParams,
  RedeemChannelParams,
  ReclaimChannelParams,
  HashchainProtocolABI,
};

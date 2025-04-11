import { HashchainProtocol } from "./protocol";
import {
  CreateChannelParams,
  RedeemChannelParams,
  ReclaimChannelParams,
} from "./types/channel";
import {
  hashchain,
  generateSeed,
  toWei,
  fromWei,
  decodeContractError,
} from "./utils";
import HashchainProtocolABI from "../abis/HashchainProtocol.abi.json";

export {
  HashchainProtocol,
  hashchain,
  generateSeed,
  toWei,
  fromWei,
  decodeContractError,
  CreateChannelParams,
  RedeemChannelParams,
  ReclaimChannelParams,
  HashchainProtocolABI,
};

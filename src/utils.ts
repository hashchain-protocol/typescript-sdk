import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";

/**
 * Convert ETH to Wei
 */
export const toWei = (eth: string | number): ethers.BigNumber => {
  return ethers.utils.parseEther(eth.toString());
};

/**
 * Convert Wei to Eth
 */
export const fromWei = (wei: ethers.BigNumberish): string => {
  return ethers.utils.formatEther(wei);
};

/**
 * Generate a random trust anchor
 */
export const generateSeed = (): string => {
  return ethers.utils.keccak256(ethers.utils.randomBytes(32));
};

/**
 * Generate a hashchain
 */
export const hashchain = (value?: string, times: number = 1): string[] => {
  let hash = value
    ? ethers.utils.hexlify(ethers.utils.toUtf8Bytes(value))
    : ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const hashes: string[] = [];

  for (let i = 0; i < times + 1; i++) {
    hash = ethers.utils.keccak256(ethers.utils.arrayify(hash));
    hashes.push(hash);
  }

  return hashes;
};

/**
 * Decodes a smart contract error using the provided ABI.
 * @param {string} errorData - The encoded error data from the transaction.
 * @param {object} abi - The ABI of the contract.
 * @returns {object} - Decoded error information.
 */
export function decodeContractError(error, abi) {
  try {
    let errorData = error?.error?.error?.error?.data;
    if (!errorData || errorData.length < 10) {
      throw new Error("Invalid error data");
    }

    // Create an ethers.js interface
    const iface = new Interface(abi);

    // Extract the error selector (first 4 bytes)
    const errorSelector = errorData.slice(0, 10);
    // console.log("Error Selector:", errorSelector);

    // Match selector with ABI
    const errors = Object.entries(iface.errors);
    let matchedError = null;

    for (const [name, fragment] of errors) {
      if (iface.getSighash(fragment) === errorSelector) {
        matchedError = name;
        break;
      }
    }

    if (!matchedError) {
      throw new Error("Error selector not found in ABI");
    }

    console.log("Matched Error:", matchedError);

    // Decode the error
    // const decodedError = iface.decodeErrorResult(matchedError, errorData);
    // console.log("Decoded Error Data:", decodedError);

    // Attempt to decode the error
    let decodedError: any = [];
    try {
      decodedError = iface.decodeErrorResult(matchedError, errorData);
    } catch (decodeErr) {
      console.warn("Decoding failed, proceeding with basic error info.");
    }

    console.log("Decoded Error Data:", decodedError);

    // Return selector and error name, ignoring decodedData completely
    return { selector: errorSelector, errorName: matchedError };
  } catch (err) {
    console.error("Error decoding failed:", err.message);
    return null;
  }
}

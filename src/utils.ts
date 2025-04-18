import { ethers } from "ethers";
import { Interface } from "ethers/lib/utils";
import { JsonFragment } from "@ethersproject/abi";

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
export function decodeContractError(error: unknown, abi: JsonFragment[]) {
  try {
    // let errorData = error?.error?.error?.error?.data;
    let errorData =
      (error as any)?.error?.error?.error?.data ??
      (error as any)?.error?.data ??
      (error as any)?.data;
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error decoding failed:", err.message);
    } else {
      console.error("Unknown error during decoding", err);
    }
    return null;
  }
}

/**
 * Approves a spender address to transfer a specified amount of ERC-20 tokens on behalf of the signer.
 *
 * @param {ethers.Signer} signer - The signer who owns the tokens and will send the approval transaction.
 * @param {string} tokenAddress - The ERC-20 token contract address.
 * @param {string} spender - The address allowed to spend the tokens (typically the smart contract address).
 * @param {ethers.BigNumber} amount - The amount of tokens to approve.
 * @returns {Promise<ethers.providers.TransactionResponse>} - The transaction response after sending the approval.
 */
export async function approveToken(
  signer: ethers.Signer,
  tokenAddress: string,
  spender: string,
  amount: ethers.BigNumber
) {
  const erc20Abi = [
    "function approve(address spender, uint256 value) returns (bool)",
  ];
  const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
  return await token.approve(spender, amount);
}

/**
 * Retrieves the current ERC-20 token allowance that the spender has for the signer's address.
 *
 * @param {ethers.Signer} signer - The signer whose allowance is being checked.
 * @param {string} tokenAddress - The ERC-20 token contract address.
 * @param {string} spender - The address of the contract or entity allowed to spend tokens.
 * @returns {Promise<ethers.BigNumber>} - The current allowance amount as a BigNumber.
 */
export async function getTokenAllowance(
  signer: ethers.Signer,
  tokenAddress: string,
  spender: string
): Promise<ethers.BigNumber> {
  const erc20Abi = [
    "function allowance(address owner, address spender) view returns (uint256)",
  ];
  const token = new ethers.Contract(tokenAddress, erc20Abi, signer);
  const owner = await signer.getAddress();
  return await token.allowance(owner, spender);
}

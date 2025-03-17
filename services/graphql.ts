const GOLDKSY_API_URL =
  "https://api.goldsky.com/api/public/project_cm85j9kf21mz301x6d08lhbpf/subgraphs/HashchainProtocol/1.0.0/gn";

/**
 * Fetches channelCreated events for a specific payer.
 */
export async function fetchChannelCreateds(payerAddress: string) {
  const query = {
    query: `
        query {
          channelCreateds(where: { payer: "${payerAddress}" }) {
            block_number
            merchant
            payer
            timestamp_
            transactionHash_
          }
        }
      `,
  };

  return fetchGraphQL(query);
}

/**
 * Fetches channelRedeemed events for a specific merchant.
 */
export async function fetchChannelRedeemeds(merchantAddress: string) {
  const query = {
    query: `
        query {
          channelRedeemeds(where: { merchant: "${merchantAddress}" }) {
            block_number
            merchant
            payer
            timestamp_
            transactionHash_
          }
        }
      `,
  };

  return fetchGraphQL(query);
}

/**
 * Fetches channelReclaimed events for a specific merchant.
 */
export async function fetchChannelReclaimeds(merchantAddress: string) {
  const query = {
    query: `
        query {
          channelReclaimeds(where: { merchant: "${merchantAddress}" }) {
            block_number
            merchant
            payer
            timestamp_
            transactionHash_
          }
        }
      `,
  };

  return fetchGraphQL(query);
}

export async function fetchAllChannels() {
  const query = {
    query: `
        query {
          channelCreateds {
            id
            merchant
            payer
            amount
          }
          channelRedeemeds {
            id
          }
          channelRefundeds {
            id
          }
          channelReclaimeds {
            id
          }
        }
      `,
  };

  return fetchGraphQL(query);
}

/**
 * Helper function to send a GraphQL request.
 */
async function fetchGraphQL(query: object) {
  try {
    const response = await fetch(GOLDKSY_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`GraphQL Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
}

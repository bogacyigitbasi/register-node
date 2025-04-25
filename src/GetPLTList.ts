/**
 * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenList.ts
 * Retrieves the protocol level tokens that exists at the end of a given block as an async
 * iterable. If a blockhash is not supplied it will pick the latest finalized
* block. An optional abortSignal can also be provided that closes the stream.
 * Note: A stream can be collected to a list with the streamToList function.
 */

import {
    BlockHash
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

const client = new ConcordiumGRPCNodeClient(
    "node.testnet.concordium.com",
    Number(20000),
    credentials.createInsecure() //  credentials.createSsl(),
);

/**
 * The following example demonstrates how to query the list of PLTs available in the network.
 */
(async () => {
    // If using a specific block hash, uncomment and replace with actual hash
    // const blockHash = BlockHash.fromHexString("someblockhash");
    // Or use undefined for latest finalized block
    const blockHash = undefined;
    const tokens = await client.getTokenList(blockHash);
    console.log('Protocol level tokens (PLTs) that exists at the end of the given block:');
    for await (const token of tokens) {
        console.log(token.toString());
    }
    // #region documentation-snippet
})();
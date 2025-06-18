/**
 * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenList.ts
 * Retrieves the protocol level tokens that exists at the end of a given block as an async
 * iterable. If a blockhash is not supplied it will pick the latest finalized
* block. An optional abortSignal can also be provided that closes the stream.
 * Note: A stream can be collected to a list with the streamToList function.
 */

import {
    BlockHash, BlockItemSummary
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-alpha.concordium.com",
    Number(20000),
    credentials.createSsl(),//credentials.createInsecure() //
);

/**
 * The following example demonstrates how to query the list of PLTs available in the network.
 */
(async () => {
    // #region documentation-snippet

    const blockHash = BlockHash.fromHexString("87628276b1b8175ee7ece5ff68311c3c40d83cc726bf76edcf6057f4f7d9b3af");
    // const blockHash = undefined;
    // const tokens = await client.getTokenList(blockHash);
    const events: AsyncIterable<BlockItemSummary> = await client.getBlockTransactionEvents(blockHash);
    // #endregion documentation-snippet
    console.log("Events")

    for await (const event of events) {
        console.log(event);
        // console.dir(event, { depth: null, colors: true });
    }
})();
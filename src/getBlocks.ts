


/**
 * Returns the PLT information with symbol
 * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenInfo.ts
 * @param symbol
 * @returns TokenInfo {TokenId, TokenState}
 */


// npx tsx src/reg.ts
import { credentials } from '@grpc/grpc-js';
import { ArrivedBlockInfo, BlockHash, BlockItemSummary, Upward } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { parseEndpoint } from '../shared/util.js';
const client = new ConcordiumGRPCNodeClient(
    "grpc.testnet.concordium.com",
    // "grpc.stagenet.concordium.com",
    Number(20000),
    credentials.createSsl(),//credentials.createInsecure() //
);

/**
 * Retrieves information about an protocol level token (PLT). The function must be provided a
 * token id.
 */
(async () => {
    // const blocks: AsyncIterable<ArrivedBlockInfo> = client.getBlocks();

    // // Prints blocks infinitely
    // for await (const block of blocks) {
    //     console.log('Arrived block height:', block.height);
    //     console.log('Arrived block hash:', block.hash, '\n');
    // }

    const blockHash = BlockHash.fromHexString("");

    const events: AsyncIterable<Upward<BlockItemSummary>> = client.getBlockTransactionEvents(blockHash);
    for await (const event of events) {
        if (isKnown(event)) {
            console.dir(event, { depth: null, colors: true });
        } else {
            console.warn('Encountered unknown event');
        }
    }
    // #endregion documentation-snippet
})();

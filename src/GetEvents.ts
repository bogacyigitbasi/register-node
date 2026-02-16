// /**
//  * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenList.ts
//  * Retrieves the protocol level tokens that exists at the end of a given block as an async
//  * iterable. If a blockhash is not supplied it will pick the latest finalized
// * block. An optional abortSignal can also be provided that closes the stream.
//  * Note: A stream can be collected to a list with the streamToList function.
//  */

// import {
//     BlockHash, BlockItemSummary
// } from '@concordium/web-sdk';
// import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
// import { credentials } from '@grpc/grpc-js';

// const client = new ConcordiumGRPCNodeClient(
//     "grpc.devnet-plt-beta.concordium.com",
//     Number(20000),
//     credentials.createSsl(),//credentials.createInsecure() //
// );


// /**
//  * The following example demonstrates how to query the list of PLTs available in the network.
//  */
// (async () => {
//     // #region documentation-snippet

//     const blockHash = BlockHash.fromHexString("dd4c921b25f92e6ab0e2179613724ece8b605d1feb70662458ef72aa8960a771");
//     // const blockHash = undefined;
//     // const tokens = await client.getTokenList(blockHash);
//     const events: AsyncIterable<BlockItemSummary> = await client.getBlockTransactionEvents(blockHash);
//     // #endregion documentation-snippet
//     console.log("Events")



//     for await (const event of events) {
//         console.log(event);
//         // console.dir(event, { depth: null, colors: true });
//     }
// })();


/**
 * Print transaction events from a specific block (or latest finalized if undefined).
 * Works across SDK versions by probing possible field names.
 *
 * Usage:
 *   ts-node getEvents.ts
 */

import { BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

// ---------- Config ----------
const NODE_ADDR = 'grpc.devnet-plt-beta.concordium.com';
const NODE_PORT = 20000;

// Choose a block or leave undefined to use latest finalized:
const BLOCK_HASH_HEX =
    'dd4c921b25f92e6ab0e2179613724ece8b605d1feb70662458ef72aa8960a771';
// const BLOCK_HASH_HEX = undefined as unknown as string | undefined;

// ---------- Helpers (robust access across SDK shapes) ----------
type MaybeHash = { toHexString?: () => string } | undefined;

function getHashHex(x: any): string {
    const h: MaybeHash =
        x?.blockItemHash ?? x?.hash ?? x?.transactionHash ?? x?.blockHash;
    return typeof h?.toHexString === 'function' ? h!.toHexString() : '<no-hash>';
}

function getType(x: any): string {
    return x?.blockItemType ?? x?.type ?? '<no-type>';
}

function getEventsArray(x: any): any[] {
    // Some SDKs put events on the top level (summary.events),
    // others under summary.details.events (for account tx).
    if (Array.isArray(x?.events)) return x.events as any[];
    if (Array.isArray(x?.details?.events)) return x.details.events as any[];
    return [];
}

function pretty(obj: unknown) {
    return JSON.stringify(
        obj,
        (_, v) => (typeof v === 'bigint' ? v.toString() : v),
        2
    );
}

// ---------- Main ----------
(async () => {
    const client = new ConcordiumGRPCNodeClient(
        NODE_ADDR,
        Number(NODE_PORT),
        credentials.createSsl() // use createInsecure() for local / non-TLS
    );

    const blockHash =
        typeof BLOCK_HASH_HEX === 'string'
            ? BlockHash.fromHexString(BLOCK_HASH_HEX)
            : undefined;

    const stream = await client.getBlockTransactionEvents(blockHash);

    console.log('Streaming events…\n');

    for await (const summary of stream as AsyncIterable<any>) {
        const hash = getHashHex(summary);
        const kind = getType(summary);
        console.log(`Tx ${hash}  kind=${kind}`);

        const events = getEventsArray(summary);
        if (events.length === 0) {
            console.log('  (no events on this item)');
            // Uncomment to inspect the full shape for your SDK version:
            // console.dir(summary, { depth: null, colors: true });
            continue;
        }

        for (const ev of events) {
            // Try a tag / type field if present
            const tag = ev?.tag ?? ev?.type ?? '<event>';
            process.stdout.write(`  • ${tag}`);

            // Print a compact view. You can specialize per tag if you want.
            // Common fields you might see include: amount, from, to, address, data, etc.
            const { tag: _t, type: _ty, ...rest } = ev || {};
            const restKeys = Object.keys(rest || {});
            if (restKeys.length > 0) {
                process.stdout.write(` ${pretty(rest)}`);
            }
            process.stdout.write('\n');
        }
    }

    console.log('\nDone.');
})().catch((e) => {
    console.error('Error while streaming events:', e);
    process.exit(1);
});

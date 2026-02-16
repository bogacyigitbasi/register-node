import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { TokenId, TokenInfo, Cbor } from '@concordium/web-sdk/plt';

const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-p10-1.concordium.com",
    20000,
    credentials.createSsl()
);

(async () => {
    // ticker
    const tokenId = TokenId.fromString('EURtest');

    // latest finalized block (use BlockHash if you need a specific block)
    const tokenInfo: TokenInfo = await client.getTokenInfo(tokenId);

    // Top-level state (already decoded to JS primitives by the SDK)
    console.log('Token ID:', tokenInfo.id.ticker);
    console.log('Total supply:', tokenInfo.state.totalSupply); // bigint
    console.log('Decimals:', tokenInfo.state.decimals);        // number
    console.log('ModuleRef:', tokenInfo.state.moduleRef.toString());

    // Decode the moduleState (CBOR) with the SDK’s embedded decoder
    const mod = Cbor.decode(tokenInfo.state.moduleState) as any;

    // Common fields you’ll find in moduleState:
    // name, paused, burnable, denyList, mintable, allowList, governanceAccount, metadata.url, ...
    console.log('Decoded moduleState:', mod);

    // If present, this is usually an icon or metadata asset (may be JSON or an image)
    console.log('metadata URL:', mod?.metadata?.url);

    if (mod?.metadata?.url) {
        const res = await fetch(mod.metadata.url);
        const ct = res.headers.get('content-type') ?? '';
        if (ct.includes('application/json')) {
            console.log('metadata JSON:', await res.json());
        } else {
            console.log('metadata fetched (non-JSON):', ct, 'bytes=', (await res.arrayBuffer()).byteLength);
        }
    }
})();



// /**
//  * Returns the PLT information with symbol
//  * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenInfo.ts
//  * @param symbol
//  * @returns TokenInfo {TokenId, TokenState}
//  */

// import {
//     BlockHash
// } from '@concordium/web-sdk';
// import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
// import { credentials } from '@grpc/grpc-js';
// import { TokenId, TokenInfo } from '@concordium/web-sdk/plt';
// const client = new ConcordiumGRPCNodeClient(
//     "grpc.devnet-plt-beta.concordium.com",
//     Number(20000),
//     credentials.createSsl(),
// );

// /**
//  * Retrieves information about an protocol level token (PLT). The function must be provided a
//  * token id.
//  */
// (async () => {
//     // #region documentation-snippet
//     // token symbol
//     const tokenId = TokenId.fromString("USDR");
//     // If using a specific block hash, uncomment and replace with actual hash
//     // Or use undefined for latest finalized block
//     const blockHash = undefined;
//     // blockHash = BlockHash.fromHexString("someblockhash");
//     const tokenInfo: TokenInfo = await client.getTokenInfo(tokenId, blockHash);

//     // Metadata struct (already decoded from CBOR)
//     console.log('Metadata struct:', tokenInfo.state.metadata);
//     console.log('Metadata URL:', tokenInfo.state.metadata.url);

//     console.log('Total token supply:', tokenInfo.state.totalSupply);
//     console.log('Total token module state:', tokenInfo.state.moduleState.toJSON());
//     console.log('Total token supply:', tokenInfo.id);
//     /* The line `console.log('Token issuer:', tokenInfo.state.issuer);` is logging the issuer of the
//     protocol level token (PLT) whose information is being retrieved. The `tokenInfo.state.issuer`
//     property contains the issuer's information for the specific PLT, and this line is outputting
//     that information to the console when the script is executed. */
//     // console.log('Token issuer:', tokenInfo.state.issuer);
//     console.log('decimals:', tokenInfo);

//     console.log('moduleRef:', tokenInfo.state.moduleRef); // only V1 for all PLTs initially.
//     // #endregion documentation-snippet
// })();

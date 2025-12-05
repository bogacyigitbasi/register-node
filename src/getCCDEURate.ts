import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

const client = new ConcordiumGRPCNodeClient(
    'grpc.testnet.concordium.com',
    20000,
    credentials.createSsl()
);

export async function getCCDEURRate(): Promise<number> {
    try {
        const chainParameters = await client.getBlockChainParameters();
        const ratio = chainParameters.microGTUPerEuro;
        return Number(ratio.numerator) / Number(ratio.denominator);
    } catch (error) {
        console.error('Error fetching CCD EUR rate:', error);
        throw error;
    }
}

(async () => {
    try {
        const microCcdPerEuro = await getCCDEURRate();
        console.log('microCCD per EUR:', microCcdPerEuro);

        // Convert to CCD per EUR (1 CCD = 1,000,000 microCCD)
        const ccdPerEuro = microCcdPerEuro / 1_000_000;
        console.log('CCD per EUR:', ccdPerEuro);

        // Convert to EUR per CCD
        const eurPerCcd = 1 / ccdPerEuro;
        console.log('EUR per CCD:', eurPerCcd);
    } catch (error) {
        console.error('Failed to get CCD EUR rate:', error);
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

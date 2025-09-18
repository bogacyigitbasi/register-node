/**
 * Returns the PLT information with symbol
 * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenInfo.ts
 * @param symbol
 * @returns TokenInfo {TokenId, TokenState}
 */

import {
    BlockHash
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { TokenId, TokenInfo } from '@concordium/web-sdk/plt';
const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-beta.concordium.com",
    Number(20000),
    credentials.createSsl(),
);

/**
 * Retrieves information about an protocol level token (PLT). The function must be provided a
 * token id.
 */
(async () => {
    // #region documentation-snippet
    // token symbol
    const tokenId = TokenId.fromString("USDR");
    // If using a specific block hash, uncomment and replace with actual hash
    // Or use undefined for latest finalized block
    const blockHash = undefined;
    // blockHash = BlockHash.fromHexString("someblockhash");
    const tokenInfo: TokenInfo = await client.getTokenInfo(tokenId, blockHash);
    console.log('Total token supply:', tokenInfo.state.totalSupply);
    console.log('Total token supply:', tokenInfo.id);
    /* The line `console.log('Token issuer:', tokenInfo.state.issuer);` is logging the issuer of the
    protocol level token (PLT) whose information is being retrieved. The `tokenInfo.state.issuer`
    property contains the issuer's information for the specific PLT, and this line is outputting
    that information to the console when the script is executed. */
    // console.log('Token issuer:', tokenInfo.state.issuer);
    console.log('decimals:', tokenInfo);

    console.log('moduleRef:', tokenInfo.state.moduleRef); // only V1 for all PLTs initially.
    // #endregion documentation-snippet
})();

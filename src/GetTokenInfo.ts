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
    "node.testnet.concordium.com",
    Number(20000),
    credentials.createInsecure() //  credentials.createSsl(),
);

/**
 * Retrieves information about an protocol level token (PLT). The function must be provided a
 * token id.
 */
(async () => {
    // #region documentation-snippet
    // token symbol
    const tokenId = TokenId.fromString("PLT_SYM");
    // If using a specific block hash, uncomment and replace with actual hash
    // Or use undefined for latest finalized block
    const blockHash = undefined;
    // blockHash = BlockHash.fromHexString("someblockhash");
    const tokenInfo: TokenInfo = await client.getTokenInfo(tokenId, blockHash);
    console.log('Total token supply:', tokenInfo.state.totalSupply);
    console.log('Token issuer:', tokenInfo.state.issuer);
    console.log('decimals:', tokenInfo.state.decimals);
    console.log('moduleRef:', tokenInfo.state.moduleRef); // only V1 for all PLTs initially.
    // #endregion documentation-snippet
})();

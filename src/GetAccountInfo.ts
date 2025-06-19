/**
 * Returns the PLT information with symbol
 * full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/client/getTokenInfo.ts
 * @param symbol
 * @returns TokenInfo {TokenId, TokenState}
 */


// npx tsx src/reg.ts
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { TokenId, TokenInfo, TokenAmount, TokenAccountInfo, Token, V1 } from '@concordium/web-sdk/plt';
import { AccountAddress, AccountInfo, AccountInfoType, BlockHash } from '@concordium/web-sdk';
const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-alpha.concordium.com",
    Number(20000),
    credentials.createSsl(),//credentials.createInsecure() //
);

/**
 * Retrieves information about an protocol level token (PLT). The function must be provided a
 * token id.
 */
(async () => {
    // #region documentation-snippet
    const accountAddress = AccountAddress.fromBase58("3JLFF6RGoKNL8V8ycvuwXU3ZCNRKh78ytdr92pTb5GADnjeDnx");
    // If using a specific block hash, uncomment and replace with actual hash
    // Or use undefined for latest finalized block
    const blockHash = undefined;
    // blockHash = BlockHash.fromHexString("someblockhash");
    const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);

    // const accountInfo2: TokenAccountInfo = await client.getAccountInfo(accountAddress, blockHash);
    console.log('Account balance:', accountInfo.accountAmount);
    console.log('Account address:', accountInfo.accountAddress);

    const tokenAccountInfo = accountInfo.accountTokens;

    // const token = await V1.Token.fromId(client, TokenId.fromString("PLT_SYM"));
    tokenAccountInfo.forEach(balance =>
        console.log(`Token ${balance.id}, balance ${balance.state.balance}`)
    );
    // #endregion documentation-snippet
})();

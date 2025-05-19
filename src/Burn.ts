/**
 * Transfers the specified amount of PLT to another address.
 * Shows how to use 2 different wallet exports (.export and .json)
 * Queries the PLT with symbol, and executes transfer with/without memo
 */

import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
} from '@concordium/web-sdk';
import { TokenId, TokenInfo, TokenAmount, TokenAccountInfo, Token, V1 } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';


const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-alpha.concordium.com",
    Number(20000),
    credentials.createSsl(),//credentials.createInsecure() //
);
/**
 * The following example demonstrates how a simple transfer can be created.
 */
(async () => {

    // #region documentation-snippet
    console.log("Current working directory:", process.cwd());

    // using wallet.export file
    const walletFile = readFileSync("3wDev.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);
    const tokenId = TokenId.fromString("0xbogac");
    const tokenAmount = TokenAmount.fromDecimal(121);
    try {
        const token = await V1.Token.fromId(client, tokenId);

        console.log(`Attempting to burn ${tokenAmount.toString()} ${tokenId.toString()} tokens...`);

        // Execute the burn operation
        const transaction = await V1.Governance.burn(token, sender, tokenAmount, signer);
        console.log(`Burn transaction submitted with hash: ${transaction}`);

        const result = await client.waitForTransactionFinalization(transaction);
        console.log('Transaction finalized:', result);
    } catch (error) {
        console.error('Error during minting operation:', error);
    }
    // #endregion documentation-snippet
})();
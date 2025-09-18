/**
 * Transfers the specified amount of PLT to another address.
 * Shows how to use 2 different wallet exports (.export and .json)
 * Queries the PLT with symbol, and executes transfer with/without memo
 */

import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
    TransactionSummaryType,
    TransactionKindString,
    RejectReasonTag,
} from '@concordium/web-sdk';
import { TokenId, TokenAmount, Cbor, Token } from '@concordium/web-sdk/plt';

import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';


const client = new ConcordiumGRPCNodeClient(
    "https://grpc.devnet-plt-beta.concordium.com",
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
    const tokenId = TokenId.fromString("TRYa");
    const token = await Token.fromId(client, tokenId);
    //    const tokenAmount = TokenAmount.fromDecimal(121);
    const tokenAmount = TokenAmount.fromDecimal(10, token.info.state.decimals); // amount to mint

    // Only the token issuer can mint tokens
    console.log(`Attempting to mint ${tokenAmount.toString()} ${tokenId.toString()} tokens...`);

    // Execute the mint operation
    const transaction = await Token.mint(token, sender, tokenAmount, signer);
    console.log(transaction.buffer);
    console.log(`Mint transaction submitted with hash: ${transaction}`);

    const result = await client.waitForTransactionFinalization(transaction);
    console.log('Transaction finalized:', result);

    if (result.summary.type !== TransactionSummaryType.AccountTransaction) {
        throw new Error('Unexpected transaction type: ' + result.summary.type);
    }

    switch (result.summary.transactionType) {
        case TransactionKindString.TokenUpdate:
            console.log('TokenMint events:');
            result.summary.events.forEach((e) => console.log(e.event));
            break;
        case TransactionKindString.Failed:
            if (result.summary.rejectReason.tag !== RejectReasonTag.TokenUpdateTransactionFailed) {
                throw new Error('Unexpected reject reason tag: ' + result.summary.rejectReason.tag);
            }
            const details = Cbor.decode(result.summary.rejectReason.contents.details);
            console.error(result.summary.rejectReason.contents, details);
            break;
        default:
            throw new Error('Unexpected transaction kind: ' + result.summary.transactionType);
    }
} catch (error) {
    console.error('Error during minting operation:', error);

    // #endregion documentation-snippet
}) ();
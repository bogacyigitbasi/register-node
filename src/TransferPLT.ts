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
import { TokenId, TokenAmount, Cbor, Token, TokenTransfer, TokenHolder } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-beta.concordium.com",
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
    const walletFile = readFileSync("3TDev.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);


    // parse the other arguments
    const tokenId = TokenId.fromString("TestDevnetDenylist"); // Replace with actual token ID
    const token = await Token.fromId(client, tokenId);
    const amount = TokenAmount.fromDecimal(20, token.info.state.decimals); // some amount to transfer
    const recipient = TokenHolder.fromAccountAddress(AccountAddress.fromBase58("3fGWbmGueJwNUtjyfsYNkMdKccXWceDdamqCjSc1pTAGktp5L9")); // replace with actual address to receive
    const memo = undefined;
    // memo = CborMemo.fromString("Any Message To add")

    const transfer: TokenTransfer = {
        recipient,
        amount,
        memo,
    };
    console.log('Specified transfer:', JSON.stringify(transfer, null, 2));

    // From a service perspective:
    // create the token instance
    const transaction = await Token.transfer(token, sender, transfer, signer);
    console.log(`Transaction submitted with hash: ${transaction}`);

    const result = await client.waitForTransactionFinalization(transaction);
    console.log('Transaction finalized:', result);

    if (result.summary.type !== TransactionSummaryType.AccountTransaction) {
        throw new Error('Unexpected transaction type: ' + result.summary.type);
    }

    switch (result.summary.transactionType) {
        case TransactionKindString.TokenUpdate:
            console.log('TokenTransfer events:');
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
})();
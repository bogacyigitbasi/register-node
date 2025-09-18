/**
* Adds an account to the token's deny list.
* Accounts on the deny list cannot hold the token when deny list is enabled.
* Only the nominated account (token issuer) can modify the deny list.
* full code example using cli: https://github.com/Concordium/concordium-node-sdk-js/blob/plt/examples/nodejs/plt/modify-list.ts
*/
import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
    TransactionSummaryType,
    TransactionKindString,
    RejectReasonTag,
    TransactionEventTag,
} from '@concordium/web-sdk';
import { TokenId, Cbor, Token, TokenHolder } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-beta.concordium.com",
    Number(20000),
    credentials.createSsl() //  credentials.Insecure(),
);

/**
* The following example demonstrates how to add an account to the deny list.
*/
// using wallet.export file
const walletFile = readFileSync("3TDev.export", 'utf8');
// parse the arguments
const tokenId = TokenId.fromString("TestDevnetDenylist"); // Replace with actual token ID
const targetAddress = TokenHolder.fromAccountAddress(AccountAddress.fromBase58("3fGWbmGueJwNUtjyfsYNkMdKccXWceDdamqCjSc1pTAGktp5L9")); // Replace with actual target address

if (walletFile !== undefined) {
    /* Service perspective: For backend services and automated systems
    Requires direct access to wallet files containing private keys. The service
    can sign and execute transactions immediately. Use this when building APIs,
    trading bots, or administrative tools where the service manages tokens automatically.*/
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);

    try {
        // create the token instance
        const token = await Token.fromId(client, tokenId);
        // Only the token issuer can modify the deny list
        console.log(`Attempting to add ${targetAddress.toString()} to deny list for ${tokenId.toString()}...`);

        // Execute the add to deny list operation
        const transaction = await Token.addAllowList(token, sender, targetAddress, signer);
        console.log(`Transaction submitted with hash: ${transaction}`);

        const result = await client.waitForTransactionFinalization(transaction);
        console.log('Transaction finalized:', result);

        if (result.summary.type !== TransactionSummaryType.AccountTransaction) {
            throw new Error('Unexpected transaction type: ' + result.summary.type);
        }

        switch (result.summary.transactionType) {
            case TransactionKindString.TokenUpdate:
                console.log('AddDenyListEvent events:');
                result.summary.events.forEach((e) => {
                    if (e.tag !== TransactionEventTag.TokenModuleEvent) {
                        throw new Error('Unexpected event type: ' + e.tag);
                    }
                    console.log('Token module event:', e, Cbor.decode(e.details, 'TokenListUpdateEventDetails'));
                });
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
        console.error('Error during list operation:', error);
    }
} else {
    console.log(`Wallet file is empty!`);
}
/**
 * Batch 4000 PLT transfers to the same recipient in a single TokenUpdate transaction.
 * No event printing; just submit, wait for finalization, and fail fast on errors.
 */

import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
    TransactionSummaryType,
    TransactionKindString,
    RejectReasonTag,
} from '@concordium/web-sdk';
import {
    TokenId,
    TokenAmount,
    Cbor,
    Token,
    TokenHolder,
    type TokenOperation,
    type TokenTransfer,
} from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

// ---- Config ----
const NODE_ADDRESS = 'grpc.devnet-plt-beta.concordium.com';
const NODE_PORT = 20000;
const WALLET_EXPORT_PATH = '3TDev.export';
const TOKEN_ID_STR = 'TestDevnetDenylist';
const RECIPIENT_ACCOUNT = '4GtDsiDmNAfs5ZEpQSLgnddSocoU7wB6bmoxLF1cBPc8sSh7jw';
const TRANSFERS_COUNT = 6552;
const AMOUNT_PER_TRANSFER_DEC = 0.02; // decimal units
// ----------------

const client = new ConcordiumGRPCNodeClient(
    NODE_ADDRESS,
    NODE_PORT,
    credentials.createSsl()
);

(async () => {
    // Signer
    const walletFile = readFileSync(WALLET_EXPORT_PATH, 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);

    // Token + params
    const tokenId = TokenId.fromString(TOKEN_ID_STR);
    const token = await Token.fromId(client, tokenId);
    const amount = TokenAmount.fromDecimal(AMOUNT_PER_TRANSFER_DEC, token.info.state.decimals);
    const recipient = TokenHolder.fromAccountAddress(AccountAddress.fromBase58(RECIPIENT_ACCOUNT));
    const memo: TokenTransfer['memo'] = undefined;

    
    const ops: TokenOperation[] = Array.from({ length: TRANSFERS_COUNT }, () => ({
        transfer: { recipient, amount, memo },
    }));

    // Submit one TokenUpdate transaction
    const txHash = await Token.sendOperations(token, sender, ops, signer);
    console.log(txHash); // print only the tx hash

    // Wait for finalization and fail fast on errors (no event printing)
    const result = await client.waitForTransactionFinalization(txHash);

    if (result.summary.type !== TransactionSummaryType.AccountTransaction) {
        throw new Error('Unexpected summary type: ' + result.summary.type);
    }

    if (result.summary.transactionType === TransactionKindString.Failed) {
        // Decode detailed reason if it is a TokenUpdate failure
        if (
            result.summary.rejectReason.tag === RejectReasonTag.TokenUpdateTransactionFailed &&
            result.summary.rejectReason.contents?.details
        ) {
            const details = Cbor.decode(result.summary.rejectReason.contents.details);
            throw new Error(
                `TokenUpdate failed: ${JSON.stringify(result.summary.rejectReason.contents)}; details=${JSON.stringify(details)}`
            );
        }
        throw new Error('Transaction failed: ' + JSON.stringify(result.summary.rejectReason));
    }

    // If we reach here, the tx finalized successfully.
    console.log('OK');
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

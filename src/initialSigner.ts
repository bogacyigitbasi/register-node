// initial-signer.ts
// pnpm add @concordium/web-sdk
// run: ts-node initial-signer.ts

import {
    ConcordiumGRPCWebClient,
    AccountAddress,
    CcdAmount,
    TransactionExpiry,
    AccountTransactionType,
    type AccountTransaction,
    type AccountTransactionSignature,
    signTransaction, // <-- use helper function
} from '@concordium/web-sdk';
import { buildAccountSigner } from '@concordium/web-sdk';
import { readFileSync, writeFileSync } from 'fs';

async function run() {
    const NODE = 'node.mainnet.concordium.software';
    const PORT = 20000;
    const SENDER = '<SENDER_ACCOUNT_BASE58>';
    const RECEIVER = '<RECEIVER_ACCOUNT_BASE58>';

    const client = new ConcordiumGRPCWebClient(NODE, PORT);

    // Build transaction
    const sender = AccountAddress.fromBase58(SENDER);
    const to = AccountAddress.fromBase58(RECEIVER);
    const { nonce } = await client.getNextAccountNonce(sender);
    const expiry = TransactionExpiry.fromDate(new Date(Date.now() + 10 * 60 * 1000));

    const tx: AccountTransaction = {
        header: { sender, nonce, expiry },
        type: AccountTransactionType.Transfer,
        payload: { toAddress: to, amount: CcdAmount.fromMicroCcd(1_000_000n) },
    };

    // Load YOUR keys from JSON file (credentialIndex -> keyIndex -> hexPrivKey)
    // Example keysA.json:
    // { "0": { "0": "abcdef...", "1": "deadbeef..." } }
    const keysA = JSON.parse(readFileSync('keysA.json', 'utf8'));
    const signerA = buildAccountSigner(keysA);

    // Sign with helper (produces partials for the keys you provided)
    const sigA: AccountTransactionSignature = await signTransaction(tx, signerA);

    // Save bundle for the next signer
    const bundle = { tx, partialSignature: sigA };
    writeFileSync('bundle.json', JSON.stringify(bundle, null, 2), 'utf8');
    console.log('Wrote bundle.json for the next signer.');
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});

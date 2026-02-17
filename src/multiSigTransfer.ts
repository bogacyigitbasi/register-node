// multiSigTransfer.ts
// Multi-sig CCD transfer with separate signing steps:
//   1. Signer A builds & signs the tx, serializes it to JSON and sends it to Signer B
//   2. Signer B deserializes, adds their signature, finalizes & submits
// Requires an account with accountThreshold >= 2 and 2 deployed credentials
// run: ts-node multiSigTransfer.ts

import {
    Transaction,
    AccountAddress,
    CcdAmount,
    parseWallet,
    buildAccountSigner,
    type SimpleAccountKeys,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync, writeFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl());

// ── Step 1: Signer A builds, signs, and exports the partially signed tx ──
async function signerA() {
    const walletA = parseWallet(readFileSync('3Atest.export', 'utf8'));
    const signKeyA = walletA.value.accountKeys.keys[0].keys[0].signKey;

    const sender = AccountAddress.fromBase58(walletA.value.address);
    const receiver = AccountAddress.fromBase58('4XX5awarDkG69YwHFH5fgMKf4gEF3EtNkL3dvQoS8e8xRDi4oi');
    const { nonce } = await client.getNextAccountNonce(sender);

    const signable = Transaction.transfer({ toAddress: receiver, amount: CcdAmount.fromMicroCcd(1_000_000n) })
        .addMetadata({ sender, nonce })
        .addMultiSig(2)
        .build();

    // Sign with credential 0
    const keysA: SimpleAccountKeys = { 0: { 0: signKeyA } };
    const partiallySigned = await Transaction.sign(signable, buildAccountSigner(keysA));

    // Serialize and "send" to Signer B (e.g. via file, API, QR code, etc.)
    const json = Transaction.toJSONString(partiallySigned);
    writeFileSync('partial-tx.json', json, 'utf8');
    console.log('Signer A: partially signed tx written to partial-tx.json');
}

// ── Step 2: Signer B loads the partial tx, co-signs, and submits ──
async function signerB() {
    const walletB = parseWallet(readFileSync('3pTest.export', 'utf8'));
    const signKeyB = walletB.value.accountKeys.keys[0].keys[0].signKey;

    // Deserialize the partially signed tx from Signer A
    const json = readFileSync('partial-tx.json', 'utf8');
    const partiallySigned = Transaction.fromJSONString(json, Transaction.signableFromJSON);

    // Co-sign with credential 1
    const keysB: SimpleAccountKeys = { 1: { 0: signKeyB } };
    const fullySigned = await Transaction.sign(partiallySigned, buildAccountSigner(keysB));

    // Finalize and submit
    const finalized = Transaction.finalize(fullySigned);
    const txHash = await client.sendTransaction(finalized);
    console.log('Signer B: submitted tx:', txHash);

    const status = await client.waitForTransactionFinalization(txHash);
    console.dir(status, { depth: null, colors: true });
}

// Run both steps sequentially (in practice these would run on separate machines)
(async () => {
    await signerA();
    await signerB();
})();

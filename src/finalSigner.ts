// finalizer.ts
// pnpm add @concordium/web-sdk
// run: ts-node finalizer.ts

import {
    ConcordiumGRPCWebClient,
    type AccountTransaction,
    type AccountTransactionSignature,
    signTransaction, // <-- use helper function
} from '@concordium/web-sdk';
import { buildAccountSigner } from '@concordium/web-sdk';
import { readFileSync } from 'fs';

function mergeSignatures(...parts: AccountTransactionSignature[]): AccountTransactionSignature {
    const out: AccountTransactionSignature = {};
    for (const p of parts) {
        for (const [credIdx, keys] of Object.entries(p)) {
            out[credIdx] ??= {};
            for (const [keyIdx, sig] of Object.entries(keys!)) {
                out[credIdx]![keyIdx] = sig;
            }
        }
    }
    return out;
}

async function run() {
    const NODE = 'node.mainnet.concordium.software';
    const PORT = 20000;

    // Load the bundle from the first signer
    const bundle = JSON.parse(readFileSync('bundle.json', 'utf8')) as {
        tx: AccountTransaction;
        partialSignature: AccountTransactionSignature;
    };
    const { tx, partialSignature: sigA } = bundle;

    // Load YOUR keys
    // Example keysB.json:
    // { "1": { "0": "cafebabe..." } }
    const keysB = JSON.parse(readFileSync('keysB.json', 'utf8'));
    const signerB = buildAccountSigner(keysB);

    // Sign the exact same tx and merge
    const sigB = await signTransaction(tx, signerB);
    const merged = mergeSignatures(sigA, sigB);

    // Submit
    const client = new ConcordiumGRPCWebClient(NODE, PORT);
    const txHash = await client.sendAccountTransaction(tx, merged);
    console.log('submitted txHash:', txHash.toHex());
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});

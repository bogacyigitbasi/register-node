import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    DataBlob,
    NextAccountNonce,
    SequenceNumber,
    TransactionExpiry,
    parseWallet,
    buildAccountSigner,
    RegisterDataPayload,
    signTransaction,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    'grpc.testnet.concordium.com',
    20000,
    credentials.createSsl()
);

// --- helpers for mempool-ack waiting ---
function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function waitUntilNodeSeesNextNonce(
    client: ConcordiumGRPCNodeClient,
    sender: AccountAddress,
    expectedNext: bigint,
    timeoutMs = 100,
    pollMs = 50
): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const next = await client.getNextAccountNonce(sender);
        if (SequenceNumber.toUnwrappedJSON(next.nonce) >= expectedNext) {
            return true;
        }
        await sleep(pollMs);
    }

    return false;
}

(async () => {
    // Load sender credentials
    const walletFile = readFileSync("3pTest.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);

    // Fetch on-chain next nonce ONCE
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(sender);
    const base: bigint = SequenceNumber.toUnwrappedJSON(nextNonce.nonce); // <-- bigint

    // Precompute 3 headers with incremented nonces (off-chain)
    const headers: AccountTransactionHeader[] = Array.from({ length: 32 }, (_, i) => ({
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: SequenceNumber.create(base + BigInt(i)),
        sender,
    }));

    // Build 3 registerData payloads (customize the bytes as you wish)
    const payloads: RegisterDataPayload[] = Array.from({ length: 32 }, (_, i) => ({
        data: new DataBlob(Buffer.from(`test #${i}`, 'utf8')),
    }));

    // Compose transactions
    const txs: AccountTransaction[] = headers.map((header, i) => ({
        header,
        payload: payloads[i],
        type: AccountTransactionType.RegisterData,
    }));

    // Sign all off-chain first
    const signatures: AccountTransactionSignature[] = await Promise.all(
        txs.map((tx) => signTransaction(tx, signer))
    );

    // --- replace concurrent send with: send in order + wait for mempool ack ---
    const sendResults: Array<PromiseSettledResult<import('@concordium/web-sdk').TransactionHash>> = [];

    for (let i = 31; i >= 0; i--) {
        const wantNonce = SequenceNumber.toUnwrappedJSON(txs[i].header.nonce);
        try {
            const hash = await client.sendAccountTransaction(txs[i], signatures[i]);
            console.log(`Sent tx #${i} (nonce ${wantNonce}) -> ${String(hash)}`);
            sendResults.push({ status: 'fulfilled', value: hash } as PromiseFulfilledResult<any>);

            // wait until this node reports the next nonce before sending the next tx
            const ok = await waitUntilNodeSeesNextNonce(client, sender, wantNonce + 1n);
            if (!ok) {
                // small extra backoff if the poll timed out (LB/propagation)
                await sleep(200);
            }
        } catch (e: any) {
            console.error(`Failed to send tx #${i} (nonce ${wantNonce}):`, e);
            sendResults.push({ status: 'rejected', reason: e } as PromiseRejectedResult);

            // still try to proceed; tiny delay helps under LB
            await sleep(200);
        }
    }

    // Log send results (same as your original logging style)
    sendResults.forEach((res, i) => {
        if (res.status === 'fulfilled') {
            console.log(`Confirmed sent tx #${i} (nonce ${base + BigInt(i)}) -> ${String(res.value)}`);
        } else {
            console.error(`Send failed tx #${i} (nonce ${base + BigInt(i)}):`, res.reason);
        }
    });

    // // (Optional) wait for finalization of successful submissions — unchanged
    // const hashes = sendResults
    //     .map((r) => (r.status === 'fulfilled' ? r.value : null))
    //     .filter((x): x is import('@concordium/web-sdk').TransactionHash => !!x);

    // const finalizeResults = await Promise.allSettled(
    //     hashes.map((h) => client.waitForTransactionFinalization(h))
    // );

    // finalizeResults.forEach((res, i) => {
    //     if (res.status === 'fulfilled') {
    //         console.log(`Finalized #${i}:`, res.value.summary);
    //     } else {
    //         console.error(`Finalization failed #${i}:`, res.reason);
    //     }
    // });
})();



// import {
//     AccountAddress,
//     AccountTransaction,
//     AccountTransactionHeader,
//     AccountTransactionSignature,
//     AccountTransactionType,
//     DataBlob,
//     NextAccountNonce,
//     SequenceNumber,
//     TransactionExpiry,
//     parseWallet,
//     buildAccountSigner,
//     RegisterDataPayload,
//     signTransaction,
// } from '@concordium/web-sdk';
// import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
// import { credentials } from '@grpc/grpc-js';
// import { readFileSync } from 'node:fs';

// const client = new ConcordiumGRPCNodeClient(
//     'grpc.testnet.concordium.com',
//     20000,
//     credentials.createSsl()
// );

// (async () => {
//     // Load sender credentials
//     const walletFile = readFileSync("3pTest.export", 'utf8');
//     const walletExport = parseWallet(walletFile);
//     const sender = AccountAddress.fromBase58(walletExport.value.address);
//     const signer = buildAccountSigner(walletExport);

//     // Fetch on-chain next nonce ONCE
//     const nextNonce: NextAccountNonce = await client.getNextAccountNonce(sender);
//     // after: const nextNonce = await client.getNextAccountNonce(sender);
//     const base: bigint = SequenceNumber.toUnwrappedJSON(nextNonce.nonce); // <-- bigint

//     // precompute 100 sequential nonces off-chain

//     // Precompute 100 headers with incremented nonces (off-chain)
//     const headers: AccountTransactionHeader[] = Array.from({ length: 100 }, (_, i) => ({
//         expiry: TransactionExpiry.futureMinutes(60),
//         nonce: SequenceNumber.create(base + BigInt(i)),
//         sender,
//     }));

//     // Build 100 registerData payloads (customize the bytes as you wish)
//     const payloads: RegisterDataPayload[] = Array.from({ length: 100 }, (_, i) => ({
//         data: new DataBlob(Buffer.from(`test #${i}`, 'utf8')),
//     }));

//     // Compose transactions
//     const txs: AccountTransaction[] = headers.map((header, i) => ({
//         header,
//         payload: payloads[i],
//         type: AccountTransactionType.RegisterData,
//     }));

//     // Sign all off-chain first
//     const signatures: AccountTransactionSignature[] = await Promise.all(
//         txs.map((tx) => signTransaction(tx, signer))
//     );

//     // Submit all at once (concurrently). Use allSettled to see per-tx outcomes.
//     const sendResults = await Promise.allSettled(
//         txs.map((tx, i) => client.sendAccountTransaction(tx, signatures[i]))
//     );

//     // Log send results
//     sendResults.forEach((res, i) => {
//         if (res.status === 'fulfilled') {
//             console.log(`Sent tx #${i} (nonce ${base + BigInt(i)}) -> ${res.value}`);
//         } else {
//             console.error(`Failed to send tx #${i} (nonce ${base + BigInt(i)}):`, res.reason);
//         }
//     });

//     // // (Optional) wait for finalization of successful submissions
//     // const hashes = sendResults
//     //     .map((r) => (r.status === 'fulfilled' ? r.value : null))
//     //     .filter((x): x is string => !!x);

//     // const finalizeResults = await Promise.allSettled(
//     //     hashes.map((h) => client.waitForTransactionFinalization(h))
//     // );

//     // finalizeResults.forEach((res, i) => {
//     //     if (res.status === 'fulfilled') {
//     //         console.log(`Finalized #${i}:`, res.value.summary);
//     //     } else {
//     //         console.error(`Finalization failed #${i}:`, res.reason);
//     //     }
//     // });
// })();

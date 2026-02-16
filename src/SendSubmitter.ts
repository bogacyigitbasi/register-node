/**
 * Submit a previously signed PLT transfer (from signed-send.json).
 * SDK: @concordium/web-sdk@10.0.2
 * Rebuilds typed fields strictly, preflights local serialization, then submits.
 */

import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import {
    AccountAddress,
    TransactionExpiry,
    AccountTransactionType,
    serializeAccountTransaction,
    serializeAccountTransactionForSubmission,
    type AccountTransaction,
    type AccountTransactionSignature,
    SequenceNumber,
    Energy,
} from '@concordium/web-sdk';
import { TokenId, Cbor } from '@concordium/web-sdk/plt';
import { readFileSync } from 'node:fs';

// ---------- helpers ----------
const fromB64 = (b64: string) => new Uint8Array(Buffer.from(b64, 'base64'));
const reviveSig = (x: any): any => {
    // Handle base64-encoded bytes
    if (x && typeof x === 'object' && '__bytes_b64' in x) {
        return fromB64((x as any).__bytes_b64);
    }
    // Handle arrays (like signature arrays)
    if (Array.isArray(x)) {
        return x.map(item => reviveSig(item));
    }
    // Handle objects
    if (x && typeof x === 'object') {
        return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, reviveSig(v)]));
    }
    // Handle primitive values
    return x;
};

// Cbor rehydrate variants (10.0.2 has one of these).
function cborFromEncodedCompat(bytes: Uint8Array): any {
    const C: any = Cbor as any;
    if (typeof C.fromEncoded === 'function') return C.fromEncoded(bytes);
    if (typeof C.fromBytes === 'function') return C.fromBytes(bytes);
    if (typeof C.fromBuffer === 'function') return C.fromBuffer(bytes);
    throw new Error('No Cbor.fromEncoded/fromBytes/fromBuffer on this SDK build.');
}

const client = new ConcordiumGRPCNodeClient(
    'grpc.devnet-plt-beta.concordium.com',
    20000,
    credentials.createSsl()
);

(async () => {
    console.log('Using object+signature path (v10.0.2) for token transfer');

    let raw: any;
    try {
        raw = JSON.parse(readFileSync('signed-send.json', 'utf8'));
        console.log('✅ Loaded signed transaction from signed-send.json');
        if (raw.metadata) {
            console.log(`📝 Transfer details: ${raw.metadata.amount} tokens to ${raw.metadata.recipient}`);
        }
    } catch (error) {
        console.error('❌ Failed to read signed-send.json:', error);
        throw error;
    }

    // 1) Rebuild the exact transaction that was signed
    console.log('🔧 Rebuilding exact signed transaction...');
    
    const sender = AccountAddress.fromBase58(raw.header.sender);
    const tokenId = TokenId.fromString(raw.payload.tokenId);
    
    // Recreate operations from CBOR bytes  
    const opsBytes = fromB64(raw.payload.operations_b64);
    const operations = cborFromEncodedCompat(opsBytes);
    if (!(operations && typeof operations === 'object')) {
        throw new Error('operations could not be reconstructed as Cbor');
    }
    
    const payload = { tokenId, operations };
    
    // Use exact same nonce and expiry as was signed
    const expiry = TransactionExpiry.fromDate(new Date(Number(raw.header.expiry) * 1000));
    const nonce = SequenceNumber.create(BigInt(raw.header.nonce));
    
    // Try adding energyAmount that might be missing from SDK structure
    const energyAmount = Energy.create(BigInt(raw.energyAmount || '30000'));
    
    const header = {
        sender,
        nonce,
        expiry,
        energyAmount // SDK 10.0.2 might require this
    };
    
    console.log(`📋 Rebuilt transaction for sender: ${raw.header.sender}, Token: ${raw.payload.tokenId}`);
    console.log(`📋 Using nonce: ${nonce}, expiry: ${raw.header.expiry}`);

    // Runtime sanity assertions
    if (!(header.sender && typeof (header.sender as any).address === 'string')) {
        throw new Error('sender not a valid AccountAddress');
    }
    if (typeof header.nonce.value !== 'bigint') {
        throw new Error('nonce is not SequenceNumber');
    }
    if (!('bytes' in (payload.operations as any))) {
        throw new Error('operations is not a Cbor object with .bytes');
    }
    if (typeof (payload.tokenId as any).value !== 'string') {
        throw new Error('tokenId not reconstructed properly');
    }

    // Create transaction object with proper header structure
    const atx: AccountTransaction = {
        type: AccountTransactionType.TokenUpdate,
        header,
        payload
    };

    // 3) Rebuild signature & assert leaves are Uint8Array
    const signature: AccountTransactionSignature = reviveSig(raw.signature);

    // Quick deep check: find the first non-Uint8Array leaf and throw
    const checkLeaves = (obj: any, path = 'signature') => {
        if (obj instanceof Uint8Array) return;
        if (obj && typeof obj === 'object') {
            for (const [k, v] of Object.entries(obj)) checkLeaves(v, `${path}.${k}`);
        } else {
            throw new Error(`Signature leaf at ${path} is not Uint8Array (got ${typeof obj})`);
        }
    };
    checkLeaves(signature);

    // 4) Try using serializeAccountTransactionForSubmission approach
    let txHash: string;
    try {
        console.log('🔧 Trying serializeAccountTransactionForSubmission...');
        const submissionBytes = serializeAccountTransactionForSubmission(atx, signature);
        if (!(submissionBytes instanceof Uint8Array) || submissionBytes.length === 0) {
            throw new Error('serializeAccountTransactionForSubmission returned empty/invalid bytes');
        }
        console.log('✅ Serialization for submission successful, bytes length:', submissionBytes.length);
        
        // Submit the transaction
        console.log('🚀 Submitting transaction...');
        txHash = await client.sendAccountTransaction(atx, signature);
        
    } catch (e) {
        console.error('❌ Serialization or submission failed:', e);
        throw e; // Don't continue if this fails
    }
    
    console.log('✅ Transaction submitted successfully!');
    console.log('📝 Transaction hash:', txHash);

    console.log('⏳ Waiting for transaction finalization...');
    const fin = await client.waitForTransactionFinalization(txHash);
    console.log('🎉 Transaction finalized!');
    console.log('📦 Block hash:', fin.blockHash);
    console.log('🔍 Summary:', fin.summary);
})().catch((e) => {
    console.error('Submit error:', e);
    process.exit(1);
});
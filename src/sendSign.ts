/**
 * PLT transfer (send) — sign now, submit later.
 * SDK: @concordium/web-sdk@10.0.2
 * Notes:
 *  - Header has ONLY { sender, nonce, expiry } on this SDK version.
 *  - TokenUpdate payload expects operations as CBOR (we persist the encoded bytes as base64).
 *  - Output: signed-send.json (safe: bigints as strings, bytes as base64).
 */

import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
    AccountTransactionType,
    TransactionExpiry,
    signTransaction,
    serializeAccountTransactionForSubmission,
    type AccountTransaction,
    type AccountTransactionHeader,
} from '@concordium/web-sdk';
import { TokenId, TokenAmount, Token, Cbor, TokenHolder } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync, writeFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    'grpc.devnet-plt-beta.concordium.com',
    20000,
    credentials.createSsl()
);

// ---- helpers for JSON safety ----
const toB64 = (u8: Uint8Array) => Buffer.from(u8).toString('base64');
const jsonReplacer = (_key: string, value: any) => {
    if (typeof value === 'bigint') return value.toString();       // ← stringify bigints
    if (value instanceof Uint8Array) return { __bytes_b64: toB64(value) }; // safety
    return value;
};
const sigToJSON = (x: any): any => {
    if (x instanceof Uint8Array) {
        return { __bytes_b64: toB64(x) };
    }
    // Handle hex strings (convert to bytes then to base64)
    if (typeof x === 'string' && /^[0-9a-fA-F]+$/.test(x) && x.length % 2 === 0) {
        const bytes = new Uint8Array(x.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
        return { __bytes_b64: toB64(bytes) };
    }
    if (Array.isArray(x)) {
        return x.map(item => sigToJSON(item));
    }
    if (x && typeof x === 'object') {
        return Object.fromEntries(Object.entries(x).map(([k, v]) => [k, sigToJSON(v)]));
    }
    return x;
};

(async () => {
    console.log('cwd:', process.cwd());

    // Configuration - change these values as needed
    const tokenSymbol = 'TestDevnetDenylist'; // ← change to your PLT symbol
    const transferAmount = '1'; // ← change amount to send
    const recipientAddress = '3TPzzVYL9U2EDrWiF1REfXnYyrJhwubZ5qN67gKjQYHAHWzwZT'; // ← change recipient (using sender for test)

    // 1) signer
    try {
        const walletFile = readFileSync('4GtDev.export', 'utf8');
        const walletExport = parseWallet(walletFile);
        const senderBase58 = walletExport.value.address;
        const sender = AccountAddress.fromBase58(senderBase58);
        const signer = buildAccountSigner(walletExport);
        const recipient = TokenHolder.fromAccountAddress(AccountAddress.fromBase58(recipientAddress));
        console.log(`✅ Loaded wallet for sender: ${senderBase58}`);
        console.log(`📍 Recipient: ${recipientAddress}`);

        // 2) token + amount
        const tokenId = TokenId.fromString(tokenSymbol);
        console.log(`🔍 Fetching token info for: ${tokenSymbol}`);
        const token = await Token.fromId(client, tokenId);
        const amount = TokenAmount.fromDecimal(transferAmount, token.info.state.decimals);
        console.log(`💰 Transfer amount: ${amount.toString()} ${tokenSymbol}`);

        const memo = undefined;
        // memo = CborMemo.fromString("Any Message To add")

        // 3) TokenUpdate payload (single transfer op), as CBOR
        // Try different recipient formats - the token might expect address bytes
        // Use the correct TokenHolder format for recipient
        const operations = Cbor.encode([{
            transfer: {
                recipient,
                amount,
                memo
            }
        }]);
        const payload = { tokenId, operations };

        // 4) header (NO energyAmount on 10.0.2)
        const { nonce } = await client.getNextAccountNonce(sender);
        const expiry = TransactionExpiry.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)); // +24h
        const header: AccountTransactionHeader = { sender, nonce, expiry };
        console.log(`📋 Transaction nonce: ${nonce}, expiry: ${expiry.toString()}`);

        // 5) tx + sign (do not submit here)
        const accountTransaction: AccountTransaction = {
            type: AccountTransactionType.TokenUpdate,
            header,
            payload,
        };
        console.log('🔐 Signing transaction...');
        const signature = await signTransaction(accountTransaction, signer);

        // 6) "wire-safe" JSON handoff
        //    We store the CBOR-encoded bytes (operations.bytes) as base64.
        const opsBytes: Uint8Array = (operations as any).bytes ?? new Uint8Array();
        const energyAmount = 30_000n; // Energy amount for the transaction
        const out = {
            type: 'TokenUpdate',
            header: {
                sender: senderBase58,
                nonce: header.nonce,
                expiry: header.expiry.toString(), // unix seconds as string
            },
            payload: {
                tokenId: tokenSymbol,
                operations_b64: toB64(opsBytes),
            },
            energyAmount: energyAmount.toString(), // Include energy amount for submitter
            signature: sigToJSON(signature),
            metadata: {
                operation: 'transfer',
                recipient: recipientAddress,
                amount: transferAmount,
                decimals: token.info.state.decimals
            }
        };

        // Save both JSON and binary formats
        writeFileSync('signed-send.json', JSON.stringify(out, jsonReplacer, 2), 'utf8');
        console.log('✅ wrote signed-send.json — hand this file to the submitter');

        // Also save as binary for direct submission
        const submissionBytes = serializeAccountTransactionForSubmission(accountTransaction, signature);
        writeFileSync('send.tx.bin', submissionBytes);
        console.log('✅ wrote send.tx.bin — binary format for direct submission');

    } catch (error) {
        console.error('❌ Signing failed:', error);
        throw error;
    }
})().catch((e) => {
    console.error('Sign error:', e);
    process.exit(1);
});
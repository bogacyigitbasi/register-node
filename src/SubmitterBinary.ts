/**
 * Submit a pre-signed PLT burn transaction from burn.tx.bin (binary format).
 * This avoids the complexity of reconstructing the transaction object from JSON.
 */

import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    'grpc.devnet-plt-beta.concordium.com',
    20000,
    credentials.createSsl()
);

(async () => {
    console.log('📦 Loading pre-signed transaction from burn.tx.bin...');
    
    try {
        // Read the binary transaction file
        const transactionBytes = readFileSync('burn.tx.bin');
        console.log('✅ Loaded transaction bytes, length:', transactionBytes.length);
        
        // Submit the pre-serialized transaction directly using the client's method
        console.log('🚀 Submitting transaction to the network...');
        const txHash = await client.sendBlockItem(transactionBytes);
        console.log('✅ Transaction submitted successfully!');
        console.log('📝 Transaction hash:', txHash);
        
        console.log('⏳ Waiting for transaction finalization...');
        const fin = await client.waitForTransactionFinalization(txHash);
        console.log('🎉 Transaction finalized!');
        console.log('📦 Block hash:', fin.blockHash);
        console.log('🔍 Summary:', fin.summary);
        
    } catch (error) {
        console.error('❌ Submission failed:', error);
        throw error;
    }
})().catch((e) => {
    console.error('Submit error:', e);
    process.exit(1);
});
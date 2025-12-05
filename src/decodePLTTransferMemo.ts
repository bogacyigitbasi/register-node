import {
    BlockItemStatus,
    TransactionHash,
    TransactionSummaryType,
    TransactionKindString,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { cborDecode } from '@concordium/web-sdk';
import { credentials } from '@grpc/grpc-js';

const client = new ConcordiumGRPCNodeClient(
    "grpc.mainnet.concordium.software",
    Number(20000),
    credentials.createSsl()
);

async function decodePLTTransferMemo(transactionHash: string): Promise<void> {
    try {
        const txHash = TransactionHash.fromHexString("9a5c86ed20dacd641b8ff27dd45e0d1c15811a56380af4bf0715df952bbed60a");
        const blockItemStatus: BlockItemStatus = await client.getBlockItemStatus(txHash);

        if (blockItemStatus.status !== 'finalized') {
            console.log(`Transaction ${transactionHash} is not finalized yet. Status: ${blockItemStatus.status}`);
            return;
        }

        const { summary } = blockItemStatus.outcome;

        if (summary.type !== TransactionSummaryType.AccountTransaction) {
            console.log('Transaction is not an account transaction');
            return;
        }

        if (summary.transactionType !== TransactionKindString.TokenUpdate) {
            console.log(`Transaction is not a token update. Type: ${summary.transactionType}`);
            return;
        }

        console.log('Found TokenUpdate transaction');
        console.log('Transaction events:');

        summary.events.forEach((eventItem, index) => {
            console.log(`Event ${index + 1}:`, eventItem);

            if (eventItem.tag === 'TokenTransfer') {
                console.log('  Transfer Details:');
                console.log('    Token ID:', eventItem.tokenId);
                console.log('    From:', eventItem.from);
                console.log('    To:', eventItem.to);
                console.log('    Amount:', eventItem.amount);

                if (eventItem.memo) {
                    console.log('    Memo found - Type:', typeof eventItem.memo);
                    console.log('    Memo object:', eventItem.memo);
                    
                    try {
                        // CborMemo has a .bytes property that contains the raw data
                        const memoBytes = (eventItem.memo as any).bytes || eventItem.memo;
                        console.log('    Raw Memo (hex):', Buffer.from(memoBytes).toString('hex'));

                        const decodedMemo = cborDecode(new Uint8Array(memoBytes));
                        console.log('    CBOR Decoded Memo:', decodedMemo);

                        // Human readable interpretation
                        console.log('    Human Readable Memo:');
                        if (typeof decodedMemo === 'string') {
                            console.log('      Text:', decodedMemo);
                        } else if (typeof decodedMemo === 'number') {
                            console.log('      Number:', decodedMemo);
                        } else if (typeof decodedMemo === 'boolean') {
                            console.log('      Boolean:', decodedMemo);
                        } else if (decodedMemo instanceof Uint8Array) {
                            const asText = Buffer.from(decodedMemo).toString('utf8');
                            const asHex = Buffer.from(decodedMemo).toString('hex');
                            console.log('      As UTF-8 text:', asText);
                            console.log('      As hex:', asHex);
                        } else if (Array.isArray(decodedMemo)) {
                            console.log('      Array:', JSON.stringify(decodedMemo, null, 8));
                        } else if (typeof decodedMemo === 'object' && decodedMemo !== null) {
                            console.log('      Object:', JSON.stringify(decodedMemo, null, 8));
                        } else {
                            console.log('      Raw value:', decodedMemo);
                        }
                    } catch (memoError) {
                        console.error('    Error decoding CBOR memo:', memoError);
                        
                        // Try different approaches to extract readable data
                        try {
                            // Check if memo has a toString method or is directly readable
                            if (typeof eventItem.memo === 'string') {
                                console.log('    Memo as string:', eventItem.memo);
                            } else if ((eventItem.memo as any).toString && typeof (eventItem.memo as any).toString === 'function') {
                                console.log('    Memo toString():', (eventItem.memo as any).toString());
                            } else {
                                console.log('    Memo structure:', JSON.stringify(eventItem.memo, null, 4));
                            }
                        } catch (fallbackError) {
                            console.log('    Could not decode memo:', (fallbackError as Error).message);
                        }
                    }
                } else {
                    console.log('    No memo included in this transfer');
                }
            }
        });

    } catch (error) {
        console.error('Error processing transaction:', error);
    }
}

async function main() {
    await decodePLTTransferMemo("9a5c86ed20dacd641b8ff27dd45e0d1c15811a56380af4bf0715df952bbed60a");
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}

export { decodePLTTransferMemo };
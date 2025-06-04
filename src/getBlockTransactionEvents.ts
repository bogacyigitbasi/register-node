import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    BlockHash,
    BlockItemSummary,
    BlockItemStatus,
    signTransaction,
    TransactionExpiry,
    parseWallet,
    buildAccountSigner,
    RegisterDataPayload,
    TransactionHash,
    cborEncode
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

import { cborDecode } from '@concordium/web-sdk';
import { CborMemo } from '@concordium/web-sdk/plt';

const client = new ConcordiumGRPCNodeClient(
    "grpc.testnet.concordium.com",
    Number(20000),
    credentials.createSsl(),//credentials.createInsecure() //
);

/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    // #region documentation-snippet


    // const registerData: RegisterDataPayload = {
    //     data: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')) // Add the bytes you wish to register as a DataBlob
    // };
    // const registerDataAccountTransaction: AccountTransaction = {
    //     header: header,
    //     payload: registerData,
    //     type: AccountTransactionType.RegisterData,
    // };
    // const blockHash = BlockHash.fromHexString("d0e61e2735b73581967f9b3afa5035ac4752293f23eecc068d308302309fdb5e");
    // const events: AsyncIterable<BlockItemSummary> = client.getBlockTransactionEvents(blockHash);
    // // #endregion documentation-snippet

    // for await (const event of events) {
    //     console.dir(event, { depth: null, colors: true });
    // }

    const blockItemStatus: BlockItemStatus = await client.getBlockItemStatus(
        TransactionHash.fromHexString("06b9352d438bc9a3e1b80e40ad98df3de166171b6aec21efdda11f8109503a13")
    );

    if (blockItemStatus.status === 'received') {
        console.log('blockItemStatus is "received" and therefore has no "status" field');
    }
    // If the transaction has only been committed, then there is a list of outcomes:
    if (blockItemStatus.status === 'committed') {
        console.log('blockItemStatus is "committed" and therefore there are potentially multiple outcomes');
    }
    // If the transaction has been finalized, then there is exactly one outcome:
    if (blockItemStatus.status === 'finalized') {
        console.log('blockItemStatus is "finalized" and therefore there is exactly one outcome \n');

        const { summary } = blockItemStatus.outcome;

        if (summary.type === 'accountTransaction') {
            console.log('The block item is an account transaction');

            switch (summary.transactionType) {
                case 'transfer':
                    // The transaction is a simple transfer
                    const { amount, to } = summary.transfer;
                    const ccdAmount = CcdAmount.toCcd(amount);
                    console.log(ccdAmount, 'CCD sent to', to);
                    break;
                case 'failed':
                    // The transaction was rejected, in which case the transaction
                    // type is still available under the failedTransactionType field
                    const { failedTransactionType, rejectReason } = summary;
                    console.log(
                        'Transaction of type "' + failedTransactionType + '" failed because:',
                        rejectReason.tag
                    );
                    break;
                default:
                    // Another transaction kind encountered
                    const otherType = summary.transactionType;
                    console.log('The transaction is of type:', otherType);
            }
        } else if (summary.type === 'updateTransaction') {
            console.log('The block item is a chain update');

            const { effectiveTime, payload } = summary;
            console.log('EffectiveTime:', effectiveTime);
            console.log('Payload:', payload);
            console;
        } else if (summary.type === 'accountCreation') {
            console.log('The block item is an account creation');
            console.log('Account created with address:', summary.address);
        }
    }


})();



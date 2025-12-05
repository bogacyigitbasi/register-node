import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    signTransaction,
    TransactionExpiry,
    parseWallet,
    buildAccountSigner,
    RegisterDataPayload,
    Cbor
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


// Include memo if it is given otherwise don't
/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    // #region documentation-snippet
    const walletFile = readFileSync("3Atest.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);

    const toAddress = AccountAddress.fromBase58("45StFAvjxS9xiSLRnWvFH8oiv49vGE4UAmDXAd3xrRor1YkjGZ");
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        sender
    );

    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };


    const memoBlob = new DataBlob(new TextEncoder().encode("memo").buffer, 'hex');


    // Include memo if it is given otherwise don't
    let simpleTransfer = {
        amount: CcdAmount.fromMicroCcd(1000),
        toAddress,
        memo: memoBlob
    };


    // #region documentation-snippet-sign-transaction
    const accountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: AccountTransactionType.TransferWithMemo,
    };
    const signer = buildAccountSigner(walletExport);
    // Sign transaction
    const signature: AccountTransactionSignature = await signTransaction(accountTransaction, signer);

    const transactionHash = await client.sendAccountTransaction(accountTransaction, signature);
    // #endregion documentation-snippet-sign-transaction

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();
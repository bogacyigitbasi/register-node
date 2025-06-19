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
    const walletFile = readFileSync("4xWa.export", 'utf8');
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

    // const registerData: RegisterDataPayload = {
    //     data: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')) // Add the bytes you wish to register as a DataBlob
    // };
    // const registerDataAccountTransaction: AccountTransaction = {
    //     header: header,
    //     payload: registerData,
    //     type: AccountTransactionType.RegisterData,
    // };



    let memo = cborEncode("123");

    // Include memo if it is given otherwise don't
    let simpleTransfer = {
        amount: CcdAmount.fromMicroCcd(1000),
        toAddress,
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
            const walletFile = readFileSync("4xWa.export", 'utf8');
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

            // const registerData: RegisterDataPayload = {
            //     data: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')) // Add the bytes you wish to register as a DataBlob
            // };
            // const registerDataAccountTransaction: AccountTransaction = {
            //     header: header,
            //     payload: registerData,
            //     type: AccountTransactionType.RegisterData,
            // };



            const cborMemoData = cborEncode("123"); // CBOR encode the string "123"

            // Include memo if it is given otherwise don't
            let simpleTransfer = {
                amount: CcdAmount.fromMicroCcd(1000),
                toAddress,
                memo: new DataBlob(cborMemoData.buffer), // Use CBOR encoded data for the memo, and .buffer
            };


            // #region documentation-snippet-sign-transaction
            const accountTransaction: AccountTransaction = {
                header: header,
                payload: simpleTransfer,
                type: AccountTransactionType.TransferWithMemo, // Change type to allow memo
            };
            const signer = buildAccountSigner(walletExport);
            // Sign transaction
            const signature: AccountTransactionSignature = await signTransaction(accountTransaction, signer);

            const transactionHash = await client.sendAccountTransaction(accountTransaction, signature);
            // #endregion documentation-snippet-sign-transaction

            const status = await client.waitForTransactionFinalization(transactionHash);
            console.dir(status, { depth: null, colors: true });
            // #endregion documentation-snippet
        })();
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
    // #endregion documentation-snippet
}) ();
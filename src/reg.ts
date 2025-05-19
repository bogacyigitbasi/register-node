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
    RegisterDataPayload
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';


const client = new ConcordiumGRPCNodeClient(
    "grpc.testnet.concordium.com",
    Number(20000),
    credentials.createInsecure() //  credentials.createSsl(),
);


/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    // #region documentation-snippet
    const walletFile = readFileSync("Wallet.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);

    // const toAddress = AccountAddress.fromBase58("receiver-address");
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        sender
    );

    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };

    const registerData: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')) // Add the bytes you wish to register as a DataBlob
    };
    const registerDataAccountTransaction: AccountTransaction = {
        header: header,
        payload: registerData,
        type: AccountTransactionType.RegisterData,
    };

    // // Include memo if it is given otherwise don't
    // let simpleTransfer = {
    //     amount: CcdAmount.fromMicroCcd(1000),
    //     toAddress,
    //     memo: new DataBlob(Buffer.from("", 'hex')),
    // };


    // // #region documentation-snippet-sign-transaction
    // const accountTransaction: AccountTransaction = {
    //     header: header,
    //     payload: registerData,
    //     type: AccountTransactionType.Transfer,
    // };

    // Sign transaction
    const signer = buildAccountSigner(walletExport);
    const signature: AccountTransactionSignature = await signTransaction(
        registerDataAccountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        registerDataAccountTransaction,
        signature
    );
    // #endregion documentation-snippet-sign-transaction

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    AccountSigner,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    signTransaction,
    TransactionExpiry,
    parseWallet,
    buildAccountSigner,
    RegisterDataPayload,
    SequenceNumber, Cbor,
    AccountTransactionV1,
    Transaction,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';


const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-p10-1.concordium.com",
    Number(20000),
    credentials.createSsl(),//
);

/// Sponsor Service
export async function sponsorTransaction(
    sender: AccountAddress.Type,
    transaction: Transaction.JSON
): Promise<Transaction.JSON> {

    // Load sponsor wallet
    const signerWallet = readFileSync("3Q_P10.export", 'utf8');
    const signerWalletExport = parseWallet(signerWallet);

    const sponsorSigner = buildAccountSigner(signerWalletExport);
    const sponsorAccount = AccountAddress.fromBase58(signerWalletExport.value.address);

    // A sponsor would probably want to do some validation of the transaction at this point, i.e.:
    // - is this a transaction I want to sponsor?
    // - can the sender successfully execute this transaction?

    // The sponsor adds themselves to the transaction
    const builder = Transaction.builderFromJSON(transaction);
    const sponsorableTransaction = builder
        .addSponsor(sponsorAccount)
        .build();

    // Sponsor adds its signatures on the transaction and returns it to be signed by the sender.
    const sponsored = await Transaction.sponsor(sponsorableTransaction, sponsorSigner);
    return Transaction.toJSON(sponsored);
}

/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {


    // User connect
    const walletFile = readFileSync("4J_DEV.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);

    // const toAddress = AccountAddress.fromBase58("receiver-address");
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        sender
    );

    // transaction header

    const header: Transaction.Metadata = {
        nonce: nextNonce.nonce,
        sender,
        expiry: TransactionExpiry.futureMinutes(5),
    };


    // User creates the payload transaction
    const signerWallet = readFileSync("4J_DEV.export", 'utf8');
    const signerWalletExport = parseWallet(signerWallet);

    const signer = buildAccountSigner(signerWalletExport);

    const registerData: RegisterDataPayload = {
        data: new DataBlob(Buffer.from(`First sponsored register`, 'utf8')),
    };

    // User constrcuts pre-mature transaction
    const transaction = Transaction.registerData(registerData).addMetadata(header).build();
    // send it to Sponsor service
    const signedBySponsor = await sponsorTransaction(sender, Transaction.toJSON(transaction));

    // received back to sign
    const sponsoredTransaction = Transaction.signableFromJSON(signedBySponsor);

    // sign & submit
    console.log('\nSubmitting sponsored transaction…');
    const signed = await Transaction.signAndFinalize(sponsoredTransaction, signer);
    const transactionHash = await client.sendTransaction(signed);
    console.log("Hash:", transactionHash.toString())
    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();



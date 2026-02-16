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
import { Cbor } from '@concordium/web-sdk/plt';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    'grpc.testnet.concordium.com',
    20000,
    credentials.createSsl()
);


export class CborDataRegistrar {
    private client: ConcordiumGRPCNodeClient;

    constructor(nodeClient?: ConcordiumGRPCNodeClient) {
        this.client = nodeClient || client;
    }

    encodeMessage(data: any): DataBlob {
        try {
            const encodedMessage = Cbor.encode(data);
            console.log('Encoded message type:', typeof encodedMessage.bytes);
            console.log('Encoded message constructor:', encodedMessage.bytes.constructor.name);
            console.log('CBOR encoded size:', encodedMessage.bytes.length, 'bytes');
            console.log('CBOR data (hex):', Buffer.from(encodedMessage.bytes).toString('hex'));
            return new DataBlob(encodedMessage.bytes.buffer);
        } catch (error) {
            console.error('Error encoding message to CBOR:', error);
            throw error;
        }
    }

    decodeMessage(dataBlob: DataBlob): any {
        try {
            const bytes = new Uint8Array(dataBlob.data);
            const cborData = new Cbor(bytes);
            const decodedMessage = Cbor.decode(cborData);
            return decodedMessage;
        } catch (error) {
            console.error('Error decoding CBOR message:', error);
            throw error;
        }
    }

    async registerCborData(): Promise<string> {
        try {

            // using wallet.export file
            const walletFile = readFileSync("3Atest.export", 'utf8');
            // const walletFile = readFileSync("3TDev.export", 'utf8');

            // Encode as JSON string so ccdscan can display it as readable text
            const dataObject = {
                hash: "ef82f62bf6d0b352d32d9a720ad130ea22650cbe3d223902628dd2a8de5f94af",
                type: "CCDVRA",
                version: 1
            };
            // const jsonStringToEncode = JSON.stringify(dataObject);

            const data = "Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus";

            const walletExport = parseWallet(walletFile);
            const sender = AccountAddress.fromBase58(walletExport.value.address);
            const signer = buildAccountSigner(walletExport);

            const encodedData = this.encodeMessage(data);

            const nextNonce = await this.client.getNextAccountNonce(sender);
            const expiry = TransactionExpiry.futureMinutes(5);

            const payload: RegisterDataPayload = {
                data: encodedData//new DataBlob(Buffer.from(data, 'utf8'))
            };

            const header: AccountTransactionHeader = {
                expiry,
                nonce: nextNonce.nonce,
                sender: sender,
            };

            const accountTransaction: AccountTransaction = {
                header,
                payload,
                type: AccountTransactionType.RegisterData,
            };

            const signature: AccountTransactionSignature = await signTransaction(
                accountTransaction,
                signer
            );

            const txHash = await this.client.sendAccountTransaction(
                accountTransaction,
                signature
            );

            console.log('CBOR data registered with transaction hash:', txHash.toString());

            console.log('CBOR data should now be decodeable by ccdscan.io');

            return txHash.toString();
        } catch (error) {
            console.error('Error registering CBOR data:', error);
            throw error;
        }
    }


}

// Run the registration
(async () => {
    const registrar = new CborDataRegistrar();
    await registrar.registerCborData();
})().catch(console.error);

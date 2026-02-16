/**
* Adds an account to the token's allow list.
* Only accounts on the allow list can hold the token when allow list is enabled.
* Only the nominated account (token issuer) can modify the allow list.
*/

import {
    AccountAddress,
    AccountTransactionType,
    serializeAccountTransactionPayload,
    parseWallet,
    buildAccountSigner,
} from '@concordium/web-sdk';
import { TokenId, V1 } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-alpha.concordium.com",
    Number(20000),
    credentials.createSsl() //  credentials.createInsecure(),
);

/**
* The following example demonstrates how to add an account to the allow list.
*/

console.log("Current working directory:", process.cwd());

// using wallet.export file
const walletFile = readFileSync("wallet.export", 'utf8');

// parse the arguments
const tokenId = TokenId.fromString("PLT_SYM");
const targetAddress = AccountAddress.fromBase58("ACCOUNT_ADDRESS");

if (walletFile !== undefined) {
    /* Service perspective: For backend services and automated systems
     Requires direct access to wallet files containing private keys. The service
     can sign and execute transactions immediately. Use this when building APIs,
     trading bots, or administrative tools where the service manages tokens automatically.*/
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);

    try {
        // create the token instance
        const token = await V1.Token.fromId(client, tokenId);

        // Only the token issuer can modify the allow list
        console.log(`Attempting to add ${targetAddress.toString()} to allow list for ${tokenId.toString()}...`);

        // Execute the add to allow list operation
        const transaction = await V1.Governance.addAllowList(token, sender, targetAddress, signer); //V1.Governance.addDenyList()
        console.log(`Transaction submitted with hash: ${transaction}`);

        const result = await client.waitForTransactionFinalization(transaction);
        console.log('Transaction finalized:', result);
    } catch (error) {
        console.error('Error during list operation:', error);
    }
} else {
    console.log(`Wallet file is empty!`);
}

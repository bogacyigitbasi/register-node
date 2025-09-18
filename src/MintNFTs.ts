// const { readFileSync } = require('fs');
// const { credentials } = require('@grpc/grpc-js');


import { readFileSync } from 'fs';
import { credentials } from '@grpc/grpc-js';
/**
 * Transfers the specified amount of PLT to another address.
 * Shows how to use 2 different wallet exports (.export and .json)
 * Queries the PLT with symbol, and executes transfer with/without memo
 */

import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
    TransactionSummaryType,
    TransactionKindString,
    RejectReasonTag,
    CcdAmount,
    AccountTransactionType,
    signTransaction,
    TransactionExpiry,
    serializeUpdateContractParameters,
    UpdateContractPayload,
    ContractName,
    EntrypointName,
    ReceiveName,
    ContractAddress,
    Energy
} from '@concordium/web-sdk';
import { TokenId, TokenAmount, Cbor, Token, TokenTransfer, TokenHolder } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';

/**
 * The following example demonstrates how a simple transfer can be created.
 */
(async () => {

    const client = new ConcordiumGRPCNodeClient(
        "grpc.testnet.concordium.com",
        Number(20000),
        credentials.createSsl(),//credentials.createInsecure() //
    );

    // #region documentation-snippet
    console.log("Current working directory:", process.cwd());

    // using wallet.export file
    const walletFile = readFileSync("3pTest.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);

    // ----- Schema + Params -----
    const schemaBuffer = readFileSync('./dist/schema.bin');
    const paramsJson = JSON.parse(readFileSync('./dist/mint-params.json', 'utf8'));

    const contractName = ContractName.fromString('poap');
    const entrypoint = EntrypointName.fromString('mint');

    const serializedParams = serializeUpdateContractParameters(
        contractName,
        entrypoint,
        paramsJson,
        schemaBuffer
    );

    console.log('✅ Serialized parameters ready');

    // ----- Account info -----
    const accountInfo = await client.getAccountInfo(sender);
    const nonce = accountInfo.accountNonce; // bigint on recent SDKs

    // ----- Header -----
    const header = {
        expiry: TransactionExpiry.futureMinutes(5),
        nonce,
        sender,
    };

    // ----- Contract target (use SDK types) -----
    const address = ContractAddress.create(11640n, 0n);
    const receiveName = ReceiveName.create(contractName, entrypoint);
    const maxEnergy = Energy.create(60000n); // adjust as needed




    // ----- Payload -----
    /** @type {UpdateContractPayload} */
    const payload = {
        amount: CcdAmount.zero(),
        address,
        receiveName,
        maxContractExecutionEnergy: maxEnergy,
        message: serializedParams,
    };

    // ----- Account transaction -----
    const accountTransaction = {
        header,
        payload,
        type: AccountTransactionType.Update,
    };

    // try {
    //     // ----- Sign & send -----
    //     const signature = await signTransaction(accountTransaction, signer);
    //     const txHash = await client.sendAccountTransaction(accountTransaction, signature);

    //     // console.log(`🚀 Transaction submitted. Hash: ${txHash.toString('')}`);

    //     // ----- Wait for finalization -----
    //     const status = await client.waitForTransactionFinalization(txHash);
    //     console.log('✅ Transaction finalized. Status:', JSON.stringify(status, null, 2));

    // } catch (error) {
    //     console.error('Error during minting operation:', error);

    //     // #endregion documentation-snippet
    // }

    try {
        // ----- Sign & send -----
        const signature = await signTransaction(accountTransaction, signer);
        const txHash = await client.sendAccountTransaction(accountTransaction, signature);

        console.log(`🚀 Transaction submitted. Hash: ${txHash.toString('hex')}`);

        // ----- Wait for finalization -----
        const status = await client.waitForTransactionFinalization(txHash);

        console.log(
            '✅ Transaction finalized. Status:',
            JSON.stringify(
                status,
                (key, value) => (typeof value === 'bigint' ? value.toString() : value),
                2
            )
        );
    } catch (error) {
        console.error('❌ Error during minting operation:', error);
    }

})();
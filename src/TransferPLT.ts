/**
 * Transfers the specified amount of PLT to another address.
 * Shows how to use 2 different wallet exports (.export and .json)
 * Queries the PLT with symbol, and executes transfer with/without memo
 */

import {
    AccountAddress,
    parseWallet,
    buildAccountSigner,
} from '@concordium/web-sdk';
import { TokenId, TokenInfo, TokenAmount, TokenAccountInfo, Token, V1 } from '@concordium/web-sdk/plt';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';


const client = new ConcordiumGRPCNodeClient(
    "grpc.devnet-plt-alpha.concordium.com",
    Number(20000),
    credentials.createSsl(),//credentials.createInsecure() //
);

/**
 * The following example demonstrates how a simple transfer can be created.
 */
(async () => {

    // #region documentation-snippet
    console.log("Current working directory:", process.cwd());

    // using wallet.export file
    const walletFile = readFileSync("3wDev.export", 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);
    const signer = buildAccountSigner(walletExport);

    // using wallet.json file
    // const walletJson = readFileSync("test-9.json", 'utf8');
    // const keys = JSON.parse(walletJson);
    // const signer = buildAccountSigner(keys);
    // const sender = AccountAddress.fromBase58(keys["address"])
    // parse the other arguments
    const tokenSymbol = TokenId.fromString("0xbogac12");
    const amount = TokenAmount.fromDecimal(10000); // some amount to transfer
    const recipient = AccountAddress.fromBase58("3syRvpKSqYd6YHbE4xq2Py4GNkXEUhCbvSPpmmNFdwAemxXevs"); // account address to receive
    const memo = undefined;
    // memo = CborMemo.fromString("Any Message To add")

    const transfer: V1.TokenTransfer = {
        recipient,
        amount,
        memo,
    };
    console.log('Specified transfer:', JSON.stringify(transfer, null, 2));

    // From a service perspective:
    // create the token instance
    const token = await V1.Token.fromId(client, tokenSymbol);
    const transaction = await V1.Token.transfer(token, sender, transfer, signer);
    console.log(`Transaction submitted with hash: ${transaction}`);
    // #endregion documentation-snippet-sign-transaction

    const status = await client.waitForTransactionFinalization(transaction);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
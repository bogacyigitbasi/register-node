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


    const account = AccountAddress.fromBase58(
        '3Tqi5eyvvvWhNwFpxCrfuiP7DjJ6Rh3aJbt5mYW23z6aBYkm4Q'
    );

    const aliasCounter: number = 1;
    const alias = AccountAddress.getAlias(account, aliasCounter);
    // From a service perspective:
    // create the token instance
    console.log(`Transaction submitted with hash: ${alias}`);
    // #endregion documentation-snippet-sign-transaction
    // #endregion documentation-snippet
})();



// dualSigner.ts
// Sponsored CCD transfer: sender signs the tx, sponsor (different account) co-signs to cover fees
// run: ts-node dualSigner.ts

import { Transaction, AccountAddress, CcdAmount, parseWallet, buildAccountSigner } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

const client = new ConcordiumGRPCNodeClient('grpc.testnet.concordium.com', 20000, credentials.createSsl());

(async () => {
    const senderWallet = parseWallet(readFileSync('3Atest.export', 'utf8'));
    const sponsorWallet = parseWallet(readFileSync('3pTest.export', 'utf8'));

    const sender = AccountAddress.fromBase58(senderWallet.value.address);
    const sponsorAddr = AccountAddress.fromBase58(sponsorWallet.value.address);
    const receiver = AccountAddress.fromBase58('4XX5awarDkG69YwHFH5fgMKf4gEF3EtNkL3dvQoS8e8xRDi4oi');
    const { nonce } = await client.getNextAccountNonce(sender);

    // Build a v1 sponsored transaction
    const signable = Transaction.transfer({ toAddress: receiver, amount: CcdAmount.fromMicroCcd(1_000_000n) })
        .addMetadata({ sender, nonce })
        .addSponsor(sponsorAddr) // sponsor pays the fees
        .build();

    // Sender signs first, then sponsor co-signs
    const senderSigned = await Transaction.sign(signable, buildAccountSigner(senderWallet));
    const fullySigned = await Transaction.sponsor(senderSigned, buildAccountSigner(sponsorWallet));

    // Finalize and submit
    const finalized = Transaction.finalize(fullySigned);
    const txHash = await client.sendTransaction(finalized);
    console.log('Submitted tx:', txHash);

    const status = await client.waitForTransactionFinalization(txHash);
    console.dir(status, { depth: null, colors: true });
})();

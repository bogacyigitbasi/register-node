import {
    ConcordiumHdWallet,
    createIdentityRequestWithKeys,
    createCredentialTransactionNoSeed,
    signCredentialTransaction,
    serializeCredentialDeploymentPayload,
    TransactionExpiry,
    CredentialInput,
    BlockHash,
    IpInfo,
    IdentityRequestWithKeysInput,
    VerifiablePresentation
    ArInfo
} from '@concordium/web-sdk';

import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';

import { credentials } from '@grpc/grpc-js';

(async () => {
    const client = new ConcordiumGRPCNodeClient(
        "grpc.testnet.concordium.com",
        // "grpc.devnet-plt-beta.concordium.com",
        Number(20000),
        credentials.createSsl(),//credentials.createInsecure() //
    );

    const wallet = ConcordiumHdWallet.fromSeedPhrase("someone wonder attitude heart meat split enroll face broccoli bird major marriage", "Testnet");

    // Cryptographic parameters
    const globalContext = await client.getCryptographicParameters();

    // IdPs
    const blockHash = "" === undefined ? undefined : BlockHash.fromHexString("29701e57096f881728b7e12d334c84db9abcc7a0801513bd95afb19b9385c6c1");
    const ips: AsyncIterable<IpInfo> = await client.getIdentityProviders(blockHash);
    for await (const ip of ips) {
        console.log('Identity Provider ID:', ip.ipIdentity);
        console.log('Identity Provider Description:', ip.ipDescription, '\n');
    }
    const identityProviders: IpInfo[] = [];
    for await (const ip of client.getIdentityProviders(blockHash)) {
        identityProviders.push(ip);
    }
    const ipInfo = identityProviders[0];

    // ARs
    const arList: ArInfo[] = [];
    const arsInfos: Record<string, ArInfo> = {};
    for await (const ar of client.getAnonymityRevokers()) {
        arList.push(ar);
        arsInfos[ar.arIdentity.toString()] = ar;
    }

    // --- STEP 1: Build identity request ----------------------

    const idCredSec = wallet.getIdCredSec(0, 0).toString('hex');
    const prfKey = wallet.getPrfKey(0, 0).toString('hex');
    const blindingRandomness = wallet
        .getSignatureBlindingRandomness(0, 0)
        .toString('hex');
    const arThreshold = Math.min(Object.keys(arsInfos).length - 1, 255);


    console.log('idCredSec:', idCredSec);
    console.log('prfKey:', prfKey);
    console.log('blindingRandomness:', blindingRandomness);
    const identityInput: IdentityRequestWithKeysInput = {
        arsInfos,
        arThreshold,
        ipInfo,
        globalContext,
        idCredSec,
        prfKey,
        blindingRandomness,
    };


    console.log('ipInfo', JSON.stringify(ipInfo, null, 2));
    console.log('AR count', Object.keys(arsInfos).length);
    console.log('idCredSec length', idCredSec.length);
    console.log('prfKey length', prfKey.length);
    console.log('blindingRandomness length', blindingRandomness.length);



})();


// const identityRequest = createIdentityRequestWithKeys(identityInput);

// console.log('✅ Identity request built');
// console.log(JSON.stringify(identityRequest, null, 2));


// // --- STEP 2: Normally you send identityRequest to IP -----
// // For demo, we simulate identity issuance (in practice, IP returns an identityObject)
// // Replace this with the actual response you get from the IP
// const mockIdentityObject = identityRequest; // placeholder

// // --- STEP 3: Create credential deployment transaction ----

// const attributeRandomness = {}; // no revealed attributes for now

// // derive the keypair for the account
// const signingKey = wallet.getAccountSigningKey(ipInfo.ipIdentity, IDENTITY_INDEX, CRED_NUMBER);

// // ConcordiumHdWallet can give you the *account public key* for that index:
// const accountPublicKey = wallet.getAccountPublicKey(ipInfo.ipIdentity, IDENTITY_INDEX, CRED_NUMBER);

// // build the AccountKeys map expected by the credential deployment
// const credentialPublicKeys = {
//     keys: {
//         0: {
//             schemeId: 'Ed25519',
//             verifyKey: accountPublicKey,
//         },
//     },
//     threshold: 1,
// };



// const response = await fetch('https://id.testnet.concordium.com/v1/identity-request', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(identityRequest),
// });
// if (!response.ok) throw new Error(`IP responded with ${response.status}`);
// const identityObject = await response.json();


// // const credentialPublicKeys = wallet.getCredentialPublicKeys(IDENTITY_INDEX, CRED_NUMBER);

// const credentialInput: CredentialInput = {
//     revealedAttributes: [],
//     idObject: identityObject, // from identity provider response in real life
//     globalContext,
//     credNumber: CRED_NUMBER,
//     ipInfo,
//     arsInfos,
//     attributeRandomness,
//     credentialPublicKeys,
//     idCredSec,
//     prfKey,
//     sigRetrievalRandomness: blindingRandomness,
// };

// const expiry = TransactionExpiry.fromDate(new Date(Date.now() + 360000));
// const credentialTx = createCredentialTransactionNoSeed(credentialInput, expiry);

// // --- STEP 4: Sign the credential deployment transaction ---


// const signature = signCredentialTransaction(credentialTx, signingKey);

// // --- STEP 5: Serialize and send using gRPC ----------------
// const payload = serializeCredentialDeploymentPayload(credentialTx, signature);
// const txHash = await client.sendCredentialDeploymentTransaction(payload);

// console.log('✅ Submitted account creation tx hash:', txHash);

// // --- STEP 6: Wait for finalization ------------------------
// const finalized = await client.waitForTransactionFinalization(txHash);
// console.log('🎉 Account created at:', finalized.result.accountAddress);
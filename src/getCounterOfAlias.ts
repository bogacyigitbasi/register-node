import { AccountAddress } from '@concordium/web-sdk';

/**
 * This example demonstrates how to interpret the last 3 bytes of an account address
 * as an alias number (subaccount ID).
 */

function main() {
    // Replace with your actual 32-byte account address in base58 format
    const base58Address = '3Tqi5eyvvvWhNwFpxCrfuiP7DjJ6Rh3aJbt5mYW23z6aBYkm4Q';
    const addr = AccountAddress.fromBase58(base58Address);

    // Extract the raw address bytes
    const rawBytes = addr.decodedAddress;

    // Prepare a 4-byte buffer with the first byte set to 0
    const aliasBytes = new Uint8Array(4);
    aliasBytes.set(rawBytes.slice(29, 32), 1); // Copy last 3 bytes into bytes 1-3

    // Convert to a 32-bit unsigned integer (big endian)
    const aliasNum = new DataView(aliasBytes.buffer).getUint32(0, false);

    console.log(`${addr.address} is alias with num ${aliasNum}`);
}

main();

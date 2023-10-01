import { payer, connection } from '@/lib/vars';
import { explorerURL, printConsoleSeparator } from '@/lib/helpers';

import {
    Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";

(async () => {
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    console.log("Payer address:", payer.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    // Get the current balance of the `payer` account on chain
    const currentBalance = await connection.getBalance(payer.publicKey);
    console.log("Current balance of 'payer' (in lamports):", currentBalance);
    console.log("Current balance of 'payer' (in SOL):", currentBalance / LAMPORTS_PER_SOL);

    // Airdrop on low balance
    if (currentBalance <= LAMPORTS_PER_SOL) {
        console.log("Low balance, requesting an airdrop...");
        await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    }

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    // Generate a new, random address to create on chain
    const keypair = Keypair.generate();

    console.log("New keypair generated:", keypair.publicKey.toBase58());

    // Create a simple instruction (using web3.js) to create an account
    // On-chain space to be allocated (in number of bytes)
    const space = 0;

    // Request the cost (in lamports) to allocate `space` number of bytes on chain
    const lamports = await connection.getMinimumBalanceForRentExemption(space);

    console.log("Total lamports:", lamports);

    // Create this simple instruction using web3.js helper function
    const createAccountIx = SystemProgram.createAccount({
        // `fromPubKey` - this account will need to sign the transaction
        fromPubkey: payer.publicKey,
        // `newAccountPubKey` - the account address to create on chain
        newAccountPubkey: keypair.publicKey,
        // `lamports` to store in this account
        lamports,
        // Total space to allocate
        space,
        // The owing program for this account
        programId: SystemProgram.programId
    });

    // Build the transaction to send to the blockchain

    // Get the latest blockhash
    let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

    // Create a message (v0)
    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        instructions: [createAccountIx]
    }).compileToV0Message();

    // Create a versioned transaction using the message
    const tx = new VersionedTransaction(message);

    // Sign the transaction with the needed Signers (e.g. `payer` and `keypair`)
    tx.sign([payer, keypair]);

    console.log("Tx after signing:", tx);

    // Send the transaction
    const sig = await connection.sendTransaction(tx);

    // Display some helper text
    printConsoleSeparator();

    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));
})();
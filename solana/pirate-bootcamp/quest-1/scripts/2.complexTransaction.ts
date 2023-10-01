import { payer, testWallet, connection, STATIC_PUBLICKEY } from "@/lib/vars";
import { explorerURL, printConsoleSeparator } from "@/lib/helpers";

import { SystemProgram, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

(async () => {
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    console.log("Payer address:", payer.publicKey.toBase58());
    console.log("Test wallet address:", testWallet.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    // Create a simple instruction (using web3.js) to create an account
    // On-chain space to be allocated (in number of bytes)
    const space = 0;

    // Request the cost (in lamports) to allocate `space` number of bytes on chain
    const balanceForRentExemption = await connection.getMinimumBalanceForRentExemption(space);

    // Create this simple instruction using web3.js helper functions
    const createTestAccountIx = SystemProgram.createAccount({
        // `fromPubkey` - this account will need to sign the transaction
        fromPubkey: payer.publicKey,
        // `newAccountPubkey` - the account address to create on chain
        newAccountPubkey: testWallet.publicKey,
        // `lamports` to store in this account
        lamports: balanceForRentExemption + 2_000_000,
        // Total space to allocate
        space,
        // The owing program for this account
        programId: SystemProgram.programId
    });

    // Create an instruction to transfer lamports
    const transferToTestWalletIx = SystemProgram.transfer({
        lamports: balanceForRentExemption + 100_000,
        // `fromPubkey` - from must sign the transaction
        fromPubkey: payer.publicKey,
        // `toPubkey` - doesn't need to sign the transaction
        toPubkey: testWallet.publicKey,
        programId: SystemProgram.programId
    });

    // Create another instruction to transfer lamports
    const transferToStaticWalletIx = SystemProgram.transfer({
        lamports: 100_000,
        // `fromPubkey` - fromm must sign the transaction
        fromPubkey: payer.publicKey,
        // `toPubkey` - doesn't need to sign the transaction
        toPubkey: STATIC_PUBLICKEY,
        programId: SystemProgram.programId
    });

    // Build the transaction to send to the blockchain
    
    // Get the latest blockhash
    let recentBlockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

    // Create a transaction message
    const message = new TransactionMessage({
        payerKey: payer.publicKey,
        recentBlockhash,
        instructions: [
            // Create the test wallet's account on chain
            createTestAccountIx,
            // Transfer lamports to the static wallet
            transferToStaticWalletIx,
            // Transfer lamports to the test wallet
            transferToTestWalletIx,
            // Transfer lamports to the static wallet
            transferToStaticWalletIx
        ]
    }).compileToV0Message();

    // Create a versioned transaction using the message
    const tx = new VersionedTransaction(message);

    // Sign the transaction with out needed Signers (e.g. `payer` and `keypair`)
    tx.sign([payer, testWallet]);

    // Send the transaction
    const sig = await connection.sendTransaction(tx);

    // Display some helper text
    printConsoleSeparator();

    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));
})();
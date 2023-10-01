import { payer, testWallet, connection } from "@/lib/vars";

import {
    buildTransaction,
    explorerURL,
    extractSignatureFailedTransaction,
    printConsoleSeparator,
    savePublicKeyToFile
} from "@/lib/helpers";

import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { MINT_SIZE, TOKEN_PROGRAM_ID, createInitializeMint2Instruction } from "@solana/spl-token";

import {
    PROGRAM_ID as METADATA_PROGRAM_ID,
    createCreateMetadataAccountV3Instruction
} from "@metaplex-foundation/mpl-token-metadata";

(async () => {
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    console.log("Payer address:", payer.publicKey.toBase58());
    console.log("Test wallet address:", testWallet.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////
    
    // Generate a new keypair to be used for the mint
    const mintKeypair = Keypair.generate();

    console.log("Mint address:", mintKeypair.publicKey.toBase58());

    // Define the assorted token config settings
    const tokenConfig = {
        // Define how many decimals we want the tokens to have
        decimals: 2,
        // Name of the token
        name: "El Dorado",
        // Token symbol
        symbol: "GOLD",
        // Not a real URL
        uri: "https://eldorado.notreal/info.json"
    };

    /**
     * Build the transaction required to create the token mint:
     * - Standard "create account" to allocate space on chain
     * - Initialize the token mint
     */

    // Create instruction for the token mint account
    const createMintAccountInstruction = SystemProgram.createAccount({
        fromPubkey: payer.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        // The `space` required for a token mint is accessible in the `@solana/spl-token` sdk
        space: MINT_SIZE,
        // Store enough lamports needed for the `space` to get rent exemption
        lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        // Tokens are owned by the "token program"
        programId: TOKEN_PROGRAM_ID
    });

    // Initialize that account as a Mint
    const InitializeMintInstruction = createInitializeMint2Instruction(
        mintKeypair.publicKey,
        tokenConfig.decimals,
        payer.publicKey,
        payer.publicKey
    );

    /**
     * Build the transaction to store the token's metadata on chain
     * - Derive the pda for the metadata account
     * - Create the instruction with the actual metadata in it
     */

    // Derive the pda address for the Metadata account
    const metadataAccount = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
        METADATA_PROGRAM_ID
    )[0];
    
    console.log("Metadata address:", metadataAccount.toBase58());

    // Create the Metadata account for the Mint
    const createMetadatainstruction = createCreateMetadataAccountV3Instruction(
        {
            metadata: metadataAccount,
            mint: mintKeypair.publicKey,
            mintAuthority: payer.publicKey,
            payer: payer.publicKey,
            updateAuthority: payer.publicKey
        },
        {
            createMetadataAccountArgsV3: {
                data: {
                    creators: null,
                    name: tokenConfig.name,
                    symbol: tokenConfig.symbol,
                    uri: tokenConfig.uri,
                    sellerFeeBasisPoints: 0,
                    collection: null,
                    uses: null
                },
                // `collectionDetails` - for non-nft type tokens, normally set to `null` to not have a value set
                collectionDetails: null,
                // Should the metadata be updatable?
                isMutable: true
            }
        }
    );

    // Build the transaction to send to the blockchain
    const tx = await buildTransaction({
        connection,
        payer: payer.publicKey,
        signers: [payer, mintKeypair],
        instructions: [
            createMintAccountInstruction,
            InitializeMintInstruction,
            createMetadatainstruction
        ]
    });

    printConsoleSeparator();

    try {
        // Send the transaction
        const sig = await connection.sendTransaction(tx);

        // Print the explorer url
        console.log("Transaction completed.");
        console.log(explorerURL({ txSignature: sig }));

        // Locally save the addresses for the demo
        savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
    } catch (error) {
        console.error("Failed to send the transaction:");
        console.log(tx);

        // Attempt to extract the signature from the failed transaction
        const failedSig = await extractSignatureFailedTransaction(connection, error);
        if (failedSig) console.log("Failed signature:", explorerURL({ txSignature: failedSig }));

        throw error;
    }
})();
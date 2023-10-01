import { payer, connection } from "@/lib/vars";
import {
    buildTransaction,
    explorerURL,
    extractSignatureFailedTransaction,
    loadPublicKeysFromFile,
    printConsoleSeparator
} from "@/lib/helpers";

import { PublicKey  } from "@solana/web3.js";
import {
    PROGRAM_ID as METADATA_PROGRAM_ID,
    createUpdateMetadataAccountV2Instruction
} from "@metaplex-foundation/mpl-token-metadata";

(async () => {
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    console.log("Payer address:", payer.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////

    // Load the stored PublicKeys for ease of use
    let localKeys = loadPublicKeysFromFile();

    // Ensure the desired script was already run
    if (!localKeys?.tokenMint)
        return console.warn("No local keys were found. Please run '3.createTokenWithMetadata.ts'");

    const tokenMint: PublicKey = localKeys.tokenMint;

    console.log("=== Local PublicKeys loaded ===");
    console.log("Token's mint address:", tokenMint.toBase58());
    console.log(explorerURL({ address: tokenMint.toBase58()}));

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    // Define the new token config settings
    const tokenConfig = {
        // New name
        name: "City of gold",
        // New symbol
        symbol: "AURUM",
        // New uri
        uri: "https://thisisnot.arealurl/new.json"
    };

    /**
     * Build the instruction to store the token's metadata on chain
     * - Derive the pda for the metadata account
     * - Create the instruction with the actual metadata in it
     */

    // Derive the pda address for the Metadata account
    const metadataAccount = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), METADATA_PROGRAM_ID.toBuffer(), tokenMint.toBuffer()],
    METADATA_PROGRAM_ID
    )[0];

    console.log("Metadata address:", metadataAccount.toBase58());

    // Create the Metadata account for the Mint
    const updateMetadataInstruction = createUpdateMetadataAccountV2Instruction(
        {
            metadata: metadataAccount,
            updateAuthority: payer.publicKey
        },
        {
            updateMetadataAccountArgsV2: {
                data: {
                    creators: null,
                    name: tokenConfig.name,
                    symbol: tokenConfig.symbol,
                    uri: tokenConfig.uri,
                    sellerFeeBasisPoints: 0,
                    collection: null,
                    uses: null
                },
                isMutable: true,
                primarySaleHappened: null,
                updateAuthority: payer.publicKey
            }
        }
    );

    // Build the transaction to send to the blockchain
    const tx = await buildTransaction({
        connection,
        payer: payer.publicKey,
        signers: [payer],
        instructions: [updateMetadataInstruction]
    });

    printConsoleSeparator();

    try {
        // Send the transaction
        const sig = await connection.sendTransaction(tx);

        // Print the explorer url
        console.log("Transaction completed.");
        console.log(explorerURL({ txSignature: sig }));
    } catch (error) {
        console.error("Failed to send the transaction:");

        // Attempt to extract the signature from the failed transaction
        const failedSig = await extractSignatureFailedTransaction(connection, error);
        if (failedSig) console.log("Failed signature:", explorerURL({ txSignature: failedSig}));

        throw error;
    }
})();
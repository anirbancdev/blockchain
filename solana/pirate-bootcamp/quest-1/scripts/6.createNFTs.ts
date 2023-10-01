import { payer, connection } from "@/lib/vars";
import { explorerURL, loadPublicKeysFromFile, printConsoleSeparator } from "@/lib/helpers";

import { PublicKey } from "@solana/web3.js";
import { Metaplex, bundlrStorage, keypairIdentity } from "@metaplex-foundation/js";

(async () => {
    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    console.log("Payer address:", payer.publicKey.toBase58());

    //////////////////////////////////////////////////////////////////////////////

    // Load the stored PublicKeys for ease of use
    let localKeys = loadPublicKeysFromFile();

    // Ensure the desired script was already run
    if (!localKeys?.tokenMint)
        return console.log("No local keys were found. Please run '3.createTokenWithMetadata.ts'");

    const tokenMint: PublicKey = localKeys.tokenMint;

    console.log("=== Local PublicKeys loaded ===");
    console.log("Token's mint address:", tokenMint.toBase58());
    console.log(explorerURL({ address: tokenMint.toBase58()}));

    //////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    /**
     * Define the NFT's JSON metadata
     * Checkout - https://nft.storage/
     */
    const metadata = {
        name: "El Dorado",
        symbol: "GOLD",
        description:
        "El Dorado is commonly associated with the legend of a gold city, kingdom, or empire purportedly located somewhere in the Americas.",
        image:
        "https://bafybeiacliffpn5uy53gzq4owi7pomvrm6lmoja7eflqn4lvo46kgrhdxa.ipfs.nftstorage.link/"
    };
    
    // Create an instance of Metaplex sdk for use
    const metaplex = Metaplex.make(connection)
        // Set the keypair to use, and pay for the transaction
        .use(keypairIdentity(payer))
        // Define a storage mechanism to upload with
        .use(
            bundlrStorage({
                address: "https://devnet.bundlr.network",
                providerUrl: "https://api.devnet.solana.com",
                timeout: 60000
            })
        );

    console.log("Uploading metadata...");

    // Upload the JSON metadata
    const { uri } = await metaplex.nfts().uploadMetadata(metadata);

    console.log("Metadata uploaded:", uri);

    printConsoleSeparator("NFT details:");

    console.log("Creating NFT using Metaplex...");

    // Create a new nft using the Metaplex sdk
    const { nft, response } = await metaplex.nfts().create({
        uri,
        name: metadata.name,
        symbol: metadata.symbol,

        // `sellerFeeBasisPoints` is the royalty that can be defined on the NFT
        sellerFeeBasisPoints: 500, 
        // Represents 5.00%

        isMutable: true
    });

    printConsoleSeparator("Find by mint:");
    const mintInfo = await metaplex.nfts().findByMint({
        mintAddress: tokenMint
    });
    console.log(mintInfo);

    return;
})();
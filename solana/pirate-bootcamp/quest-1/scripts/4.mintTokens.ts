import { payer, connection } from "@/lib/vars";
import { explorerURL, loadPublicKeysFromFile } from "@/lib/helpers";

import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";

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

  console.log("==== Local PublicKeys loaded ====");
  console.log("Token's mint address:", tokenMint.toBase58());
  console.log(explorerURL({ address: tokenMint.toBase58() }));

  //////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////

  /**
   * SPL tokens are owned using a special relationship where the actual tokens
   * are stored/ owned by a different account, which is then owned by the user's
   * wallet/ account. This special account is called "associated token account" 
   * or ata for short.
   * ---
   * Think of it like this: tokens are stored in the ata for each `tokenMint`,
   * the ata is then owned by the user's wallet.
   */

  // Get or create the token's ata
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    tokenMint,
    payer.publicKey,
  ).then(ata => ata.address);

  /*
    Note: When creating an ata, the instruction will allocate space on chain. If we attempt to allocate
    space at an existing address on chain, the transaction will fail.
    ---
    Sometimes, it may be useful to directly create the ata when we know it has not already been created 
    on chain.
  */

  console.log("Token account address:", tokenAccount.toBase58());

  /**
   * The number of tokens to mint takes into account the `decimal` places set on the `tokenMint`.
   * ---
   * - if decimals = 2, amount = 1_000    => actual tokens minted == 10
   * - if decimals = 2, amount = 10_000   => actual tokens minted == 100
   * - if decimals = 2, amount = 10       => actual tokens minted == 0.10
   */

  const amountOfTokensToMint = 1_000;

  // Mint some token to the ata
  console.log("Minting some tokens to the ata...");
  const mintSig = await mintTo(
    connection,
    payer,
    tokenMint,
    tokenAccount,
    payer,
    amountOfTokensToMint,
  );

  console.log(explorerURL({ txSignature: mintSig }));
})();
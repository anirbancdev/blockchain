import dotenv from "dotenv";
import { Connection , clusterApiUrl } from "@solana/web3.js";
import { loadKeypairFromFile, loadOrGenerateKeypair } from "./helpers";
import { PublicKey } from "@metaplex-foundation/js";

// Load the env variables from the file
dotenv.config();

/**
 * Load the `payer` keypair from the local filesystem, or load/ generate
 * a new one and store it within the local directory
 */
export const payer = process.env?.LOCAL_PAYER_JSON_ABSPATH
? loadKeypairFromFile(process.env?.LOCAL_PAYER_JSON_ABSPATH)
: loadOrGenerateKeypair("payer");

// Generate a new Keypair for testing, named `wallet`
export const testWallet = loadOrGenerateKeypair("testWallet");

// Load the env variables and store the cluster RPC url
export const CLUSTER_URL = process.env.RPC_URL ?? clusterApiUrl("devnet");

// Create a new RPC connection
export const connection = new Connection(CLUSTER_URL, "single");

// Define an address to transfer lamports to
export const STATIC_PUBLICKEY = new PublicKey("HHGX7sBwwX7AgXxfT8UFcjYhe1HsDDvFMGvNfdgVgGGq");
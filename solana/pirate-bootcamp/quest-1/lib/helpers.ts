import fs from "fs";
import path from  "path";
import {
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    TransactionInstruction,
    TransactionMessage,
    VersionedTransaction
} from "@solana/web3.js";

// Define default locations
const DEFAULT_KEY_DIR_NAME = ".local_keys";
const DEFAULT_PUBLIC_KEY_FILE = "keys.json";
const DEFAULT_DEMO_DATA_FILE = "demo.json";

// Load locally stored PublicKey addresses
export function loadPublicKeysFromFile(
    absPath: string = `${DEFAULT_KEY_DIR_NAME}/${DEFAULT_PUBLIC_KEY_FILE}`
) {
    try {
        if (!absPath) throw Error ("No path provided");
        if (!fs.existsSync(absPath)) throw Error("File does not exist.");

        // Load the public keys from the file
        const data = JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" })) || {};

        // Convert all loaded keyed values into valid public keys
        for (const [key, value] of Object.entries(data)) {
            data[key] = new PublicKey(value as string) ?? "";
        }
        return data;
    } catch (error) {
    }
    return {};
};

// Locally save a demo data to the filesystem for retrieving later
export function saveDemoDataToFile(
    name: string,
    newData: any,
    absPath: string = `${DEFAULT_KEY_DIR_NAME}/${DEFAULT_DEMO_DATA_FILE}`
) {
    try {
        let data: object = {};

        // Fetch all the current values, when the file exists
        if (fs.existsSync(absPath))
        data = JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" })) || {};

        data = { ...data, [name]: newData };

        // Save the data to the file
        fs.writeFileSync(absPath, JSON.stringify(data), {
            encoding: "utf-8"
        });
        return data;
    } catch (error) {
        console.warn("Unable to save to file");
        console.warn(error);
    }
    return {};
};

// Locally save PublicKey addresses to the filesystem for retrieving later
export function savePublicKeyToFile(
    name: string,
    publicKey: PublicKey,
    absPath: string = `${DEFAULT_KEY_DIR_NAME}/${DEFAULT_PUBLIC_KEY_FILE}`
) {
    try {
        // Fetch all the current values
        let data: any = loadPublicKeysFromFile(absPath);

        // Convert all loaded keyed values from PublicKeys to strings
        for ( const [key, value] of Object.entries(data)) {
            data[key as any] = (value as PublicKey).toBase58();
        }
        data = { ...data, [name]: publicKey.toBase58() };

        // Save the data to the file
        fs.writeFileSync(absPath, JSON.stringify(data), {
            encoding: "utf-8",
        });

        // Reload the keys for sanity
        data = loadPublicKeysFromFile(absPath);

        return data;
    } catch (error) {
        console.warn("Unable to save to file");
    }
    return {};
};

// Load a locally stored JSON keypair file and convert it to a valid keypair
export function loadKeypairFromFile(
    absPath: string
) {
    try {
        if (!absPath) throw Error("No path provided");
        if (!fs.existsSync(absPath)) throw Error("File does not exist");

        // Load the keypair from the file
        const keyfileBytes = JSON.parse(fs.readFileSync(absPath, { encoding: "utf-8" }));
        // Parse the loaded secretKey into a valid keypair
        const keypair = Keypair.fromSecretKey( new Uint8Array(keyfileBytes));
        return keypair;
    } catch (error) {
        throw error;
    }
};

// Save a locally stored JSON keypair file for importing later
export function saveKeypairToFile(
    keypair: Keypair,
    fileName: string,
    dirName: string = DEFAULT_KEY_DIR_NAME
) {
    fileName = path.join(dirName, `${ fileName }.json`);

    // Create the `dirName` directory, if it doesn't exists
    if (!fs.existsSync(`./${dirName}/`)) fs.mkdirSync(`./${dirName}/`);

    // Remove the current file, if it already exists
    if (fs.existsSync(fileName)) fs.unlinkSync(fileName);

    // Write the `secretKey` value as a string
    fs.writeFileSync(fileName, `[${keypair.secretKey.toString()}]`, {
        encoding: "utf-8"
    });
    return fileName;
};

// Attempt to load a keypair from the filesystem, or generate and save a new one
export function loadOrGenerateKeypair(
    fileName: string,
    dirName: string = DEFAULT_KEY_DIR_NAME
) {
    try {
        // Compute the path to locate the file
        const searchPath = path.join(dirName, `${fileName}.json`);
        let keypair = Keypair.generate();

        // Attempt to load the keypair from the file
        if (fs.existsSync(searchPath)) keypair = loadKeypairFromFile(searchPath);
        // When unable to locate the keypair, save the new one
        else saveKeypairToFile(keypair, fileName, dirName);

        return keypair;
    } catch (error) {
        console.error("loadOrGenerateKeypair:", error);
        throw error;
    }
};

// Compute the Solana explorer address for the data
export function explorerURL(
    {
        address,
        txSignature,
        cluster
    } : {
        address?: string;
        txSignature?: string;
        cluster?: "devnet" | "testnet" | "mainnet" | "mainnet-beta";
    }
) {
    let baseURL: string;

    if (address) baseURL = `https://explorer.solana.com/address/${address}`;
    else if (txSignature) baseURL = `https://explorer.solana.com/tx/${txSignature}`;
    else return "[unknown]";

    // Auto append the desired search parameters
    const url = new URL(baseURL);
    url.searchParams.append("cluster", cluster || "devnet");
    return url.toString() + "\n";
};

// Auto airdrop the given wallet with balance if balance < 0.5 SOL
export async function airdropOnLowBalance(
    connection: Connection,
    keypair: Keypair,
    forceAirdrop: boolean = false
) {
    // Get current balance
    let balance = await connection.getBalance(keypair.publicKey);

    // Define the low balance threshold before airdrop
    const MIN_BALANCE_TO_AIRDROP = LAMPORTS_PER_SOL / 2;

    // Check the balance of the account, airdrop when low
    if (forceAirdrop == true || balance < MIN_BALANCE_TO_AIRDROP) {
        console.log(`Requesting airdrop of 1 SOL to ${ keypair.publicKey.toBase58() }`);
        await connection.requestAirdrop(keypair.publicKey, LAMPORTS_PER_SOL).then(sig => {
            console.log("Tx signature:", sig);
        });
    }
    return balance;
};

// Helper function to extract a transaction signature from a failed transaction's error message
export async function extractSignatureFailedTransaction(
    connection: Connection,
    error: any,
    fetchLogs?: boolean
) {
    if (error?.signature) return error.signature;

    // Extract the failed transaction's signature
    const failedSig = new RegExp(/^((.*)?Error:)?(Transaction|Signature) ([A-Z0-9]{32,}) /gim).exec(
        error?.message.toString(),
    )?.[4];

    if (failedSig) {
        // Fetch the logs when required
        if (fetchLogs)
        await connection
        .getTransaction(failedSig, {
    maxSupportedTransactionVersion: 0
})
.then(tx => {
    console.log(`\n==== Transaction logs for ${failedSig} ====`);
    console.log(explorerURL({ txSignature: failedSig }), "");
    console.log(tx?.meta?.logMessages ?? "No log messages provided by RPC");
    console.log(`==== END LOGS ====\n`);
});
else {
    console.log("\n========================================");
    console.log(explorerURL({ txSignature: failedSig }));
    console.log("========================================\n");
        }
    }
    return failedSig;
};

// Standard number formatter
export function numberFormatter(
    num: number,
    forceDecimals = false
) {
    // Set the significant figures
    const minimumFractionDigits = num < 1 || forceDecimals ? 10 : 2;

    // Do the formatting
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits
    }).format(num);
};

// Display a separator in the console, with or without a message
export function printConsoleSeparator(
    message?: string
) {
    console.log("\n===============================================");
    console.log("===============================================\n");
    if (message) console.log(message);
};

// Helper function to build a signed transaction
export async function buildTransaction(
    {
        connection,
        payer,
        signers,
        instructions
    }: {
        connection: Connection;
        payer: PublicKey,
        signers: Keypair[];
        instructions: TransactionInstruction[];
    }
): Promise<VersionedTransaction> {
    let blockhash = await connection.getLatestBlockhash().then(res => res.blockhash);

    const messageV0 = new TransactionMessage({
        payerKey: payer,
        recentBlockhash: blockhash,
        instructions
    }).compileToLegacyMessage();

    const tx = new VersionedTransaction(messageV0);

    signers.forEach(s => tx.sign([s]));

    return tx;
};
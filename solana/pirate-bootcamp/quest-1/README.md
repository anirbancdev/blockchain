## This quest initially involved writing code to mint an NFT that will represent a pirate ship

### I've modified the quest to build an El Dorado NFT, but most of the tutorials have been kept intact

#### Tech stack used:
- TypeScript and NodeJS
- yarn (as the package manager)

#### How to set locally:
1. Clone this repo into your local system
2. Install the packages via `yarn install`
3. Rename the `example.env` file to `.env`
4. Update the `RPC_URL` variable to be the cluster URL of a supporting RPC provider
5. For locally installed Solana CLI, update the `LOCAL_PAYER_JSON_ABSPATH` to the **absolute path** of your local testing wallet keypair JSON file.

#### The **absolute path** can be obtained by running the following command in the terminal -
```bash
solana config get
```
#### The included scripts with their corresponding outputs:
| Scripts | Outputs |
|---------|---------|
| [`1.simpleTransaction`](./scripts/1.simpleTransaction.ts) | [`1.simpleTransaction`](./outputs/1.simpleTransaction.txt) |
| [`2.complexTransaction`](./scripts/2.complexTransaction.ts) | [`2.complexTransaction`](./outputs/2.complexTransaction.txt) |
| [`3.createTokenWithMetadata`](./scripts/3.createTokenWithMetadata.ts) | [`3.createTokenWithMetadata`](./outputs/3.createTokenWithMetadata.txt) |
| [`4.mintTokens`](./scripts/4.mintTokens.ts) | [`4.mintTokens`](./outputs/4.mintTokens.txt) |
| [`5.updateMetadata`](./scripts/5.updateMetadata.ts) | [`5.updateMetadata`](./outputs/5.updateMetadata.txt) |
| [`6.createNFTs`](./scripts/6.createNFTs.ts) | [`6.createNFTs`](./outputs/6.createNFTs.txt) |

#### The included scripts can be executed using -

```bash
yarn demo ./scripts/<script>
```
> Run the scripts in order, as some scripts may save various bits of data to a `.local_keys` folder within this repo for other ts files later in this ordered list.

#### Quick links to learn more about this workshop:

- https://docs.solana.com/developers
- Slides from the workshop:
    - https://docs.google.com/presentation/d/1N2-3XMqtoZspSeiPJt3JQChTljCxb-0xJTelP315g1I/edit?usp=sharing
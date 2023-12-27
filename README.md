subquery

```
@btwiuse ➜ /workspaces/subquery (main) $ subql init
Project name [subql-starter]: insc
? Select a network family 
  EVM Networks 
  Algorand 
  Cosmos 
  Concordium 
  NEAR 
❯ Polkadot 
  Stellar

? Select a network vara
❯ Vara

? Select a template project (Use arrow keys or type to search)
❯ vara-starter      
  Other            Enter a custom git endpoint
   
RPC endpoint: [wss://archive-rpc.vara-network.io]: wss://testnet-archive.vara-network.io

```

```
let ALICE = "kGkLEU3e3XXkJp2WK4eNpVmSab5xUNL9QtmLPh8QfCL2EgotW";
let { signer } = await web3FromAddress(ALICE);

api.setSigner(signer);

// Estimate the fee
// for (;;) {
let tx = api.tx.system.remarkWithEvent(`INSC::DEPLOY MEME 10000 10`);

await tx.signAndSend(ALICE);
```
# Itties ecosystem

Front end and Solidity contract for the Itties NFT collection.

## On-chain functionality

- Blind ERC-721 mint at 0.02 ETH.
- Wallet ownership checks for the token-ID Lab.
- Free first trait configuration and 0.00025 ETH restyles.
- Seven trait categories with six indexed options each.
- Permanent on-chain wardrobe flags for every selected trait.
- Per-wallet mint/holding limit and fixed collection supply, both chosen at deployment.
- Collection-operator win recording and retirement at ten wins.
- On-chain Hall of Fame token IDs.

## Launch settings

- Network: Base mainnet (chain ID `8453`).
- Proposed supply and mint cap: 10,000 NFTs total, maximum 3 mints per wallet. These are planning defaults only; the deployed contract makes them permanent, so confirm them before deployment.
- Mint: 0.02 ETH; first trait configuration: free; restyle: 0.00025 ETH.

## Before deployment

1. Confirm the supply and per-wallet mint cap, then choose a permanent metadata hosting URL.
2. Install Solidity 0.8.24+ and OpenZeppelin Contracts 5.x.
3. Compile and deploy `contracts/IttyLabProtocol.sol` with the final constructor values.
4. Put the deployed Base contract address in `config.js` (chain ID and explorer are already set).
5. Host metadata and final token artwork at the configured base URI. Current AI trait sheets are review boards, not individual NFT renders.

The browser never receives a private key. Wallets sign transactions locally. No private key, contract address, or RPC secret belongs in the source files.

## Preview

Serve this directory over HTTP and open it in a browser with an EVM wallet extension. The wallet will not enable minting until `config.js` points to a deployed contract on the selected chain.

## Main files

- `index.html`, `styles.css`, `app.js`, `config.js` — site and wallet-connected Lab
- `contracts/IttyLabProtocol.sol` — NFT and wardrobe contract
- `assets/` — compressed character concept art
- `artwork-traits/` — compressed 3D trait concept sheets
- `artwork-layers/itty-001/` — layered pencil artwork study
- `traits.md` — trait options and design boundaries

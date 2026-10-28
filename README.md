# Itties — House of Joshi

Responsive Base NFT experience built with Next.js, RainbowKit, Wagmi, and three Solidity contracts. This source implements the launch blueprint's mint, collectible expansion packs, tournament, metadata, and Hall of Fame flows.

## Implemented

- Base and Base Sepolia wallet connection.
- ERC-721 genesis mint for `0.025 ETH`, with unlimited public supply and a separate House pool capped at 200.
- ERC-1155 trait expansion packs paid for in `$KING` and `$QUEEN`; packs attach permanently to an Itty and contribute to its rarity score.
- Lab refresh pricing: 50 `$KING` + 50 `$QUEEN`; Standard expansion pricing: 150 + 150; Luxury: 400 + 400. Exact pack contents and caps are configured when the owner creates each pack.
- ERC-2981 royalty default of 5%.
- 24-hour flash tournaments, operator scoring, winner/revamp credits, and Hall of Fame leaderboards.
- Retirement after 52 verified wins to the dead vault, plus one claimable genesis credit and Hall of Fame reward pages.
- Dynamic ERC-721 JSON metadata and SVG renderer that composes the base pencil artwork with attached pack artwork.
- Operator panel for verifying wins, issuing credits, creating pack definitions, and creating tournaments.

## Local setup

Requirements: Node.js 20.9+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. RainbowKit provides the wallet picker, Base network selection, and branded connection modal. Add a WalletConnect/Reown project ID from [Reown Cloud](https://cloud.reown.com/) to `.env.local` to enable QR and mobile deep-link pairing; injected browser wallets can connect without it. To enable on-chain actions, fill in the deployed addresses and metadata configuration described below. The site remains viewable without these values.

Compile all three Solidity contracts with the pinned local compiler:

```sh
npm run compile:contracts
```

Build the production site:

```sh
npm run build
npm start
```

## Deployment configuration

The provided `$KING` (`0x8a66…6483`), `$QUEEN` (`0x1f2f…0aa5`), and House wallet (`0x6736…6a5f`) addresses are prefilled in `.env.example` and `.env.local`. The House wallet is configured as both treasury and royalty receiver. Before deployment, add the deployer key and a permanent metadata base URI to `.env.local`; the public token addresses and House wallet are not secrets. The tokens must use 18 decimals because contract fees are denominated in whole-token units.

Set `DEPLOY_METADATA_BASE_URI` to the final site's absolute `/api/metadata/` URL (including the trailing slash), so marketplace token URIs can reach the JSON endpoint. Configure `NEXT_PUBLIC_CORE_ADDRESS`, `NEXT_PUBLIC_PACKS_ADDRESS`, and `NEXT_PUBLIC_TOURNAMENTS_ADDRESS` from the deployment output in the site's production environment. The KING, QUEEN, treasury, and royalty addresses are already prefilled. Set `NEXT_PUBLIC_START_BLOCK` to the deployment block so the Hall of Fame page can scan win events efficiently.

Deploy first to Base Sepolia and review the deployed contracts and transaction flows:

```sh
npm run deploy:sepolia
```

After verification and a deliberate mainnet release:

```sh
npm run deploy:base
```

The deployment script deploys `IttiesCore`, `IttiesExpansionPacks`, and `IttiesFlashTournaments`, wires their roles, and writes public addresses to the ignored `.env.local`. It does not deploy `$KING` or `$QUEEN`; those addresses must already exist. Deploying the contracts is a separate, irreversible on-chain action and is not performed by the build.

## Contract design notes

- Itties are soulbound throughout the active climb. At 52 verified wins, the contract automatically transfers the Itty to the public keyless dead-address vault; it remains visible on-chain and cannot return to active circulation.
- `IttiesFlashTournaments` caps a tournament at 256 entrants so on-chain finalization is bounded. Results are submitted by an authorized operator; the current app does not independently verify off-chain match results.
- A tournament entrant receives a revamp credit at registration; the winner receives an additional credit. A 52-win retirement yields one genesis credit to the previous holder.
- Each expansion pack's items and rarity caps are recorded on-chain at creation, and each pack can be attached at most once to a given Itty.
- The renderer accepts IPFS pack image URIs through the configured gateway. Keep images optimized and publish pack JSON with a transparent pencil-body layer that matches the selected base artwork.
- No smart contract is formally audited. Review, test on Base Sepolia, and obtain an independent security review before any mainnet launch.

## Main paths

- `app/page.jsx` — mint, inventory, trait pack, tournament, Hall of Fame, and operator experiences.
- `app/rewards/[slug]/page.jsx` — Hall of Fame reward detail pages.
- `app/api/metadata/[tokenId]/route.js` — token metadata.
- `app/api/render/[tokenId]/route.js` — composed NFT SVG image.
- `contracts/IttiesCore.sol` — ERC-721 mint, credits, win retirement, metadata, royalties.
- `contracts/IttiesExpansionPacks.sol` — ERC-1155 expansion-pack marketplace and binding.
- `contracts/IttiesFlashTournaments.sol` — timed tournament, scoring, and rewards.
- `scripts/deploy.mjs` — Base Sepolia / Base deployment and wiring.
- `artwork-traits/`, `artwork-layers/`, `public/assets/` — compressed concept art, layered study, and site imagery.

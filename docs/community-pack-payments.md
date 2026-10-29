# Expansion pack payment routes

Regular and luxury packs keep their existing KING **and** QUEEN prices. Community packs use one owner-verified ERC-20 on Base, with proceeds transferred directly to the configured House treasury. The contract does not swap or sell treasury receipts.

Community names: DOGE, FLOKI, PEPE, SHIBA (SHIB), TOSHI. No canonical or bridged token addresses are assumed or prefilled. Verify the project's accepted Base deployment or bridge before creating its pack. A matching ticker does not verify authenticity. Native assets on other chains cannot be passed to this ERC-20 purchase route.

## Contract configuration

- `createPack(...)`: existing KING + QUEEN route, unchanged.
- `createCommunityPack(name, metadataURI, token, unitPrice, rarityWeight, supplyCap)`: owner-only, atomically creates a pack with its own ERC-20 payment route. The token must have deployed code and the price must be positive. A zero cap means unlimited supply.
- `communityPayment(id)`: returns token address and exact unit price; zero address means regular pricing.
- `setCommunityPrice(id, unitPrice)`: owner-only price maintenance. It cannot change the token or turn a regular pack into a community pack.
- `buyCommunityExpansion(id, quantity, expectedToken, expectedUnitPrice)`: quote fields must still match at execution. Community packs cannot be bought through `buyExpansion` or paid for using KING + QUEEN instead.

Prices are integer token base units. The owner form reads token decimals and rejects excess decimal precision. A $1 target from the PDF is **not** a fixed $1 charge: an oracle or signed, expiring USD quote service would be a separate addition. This version displays the exact configured token amount and does not claim a USD value.

The frontend reads payment settings from the contract rather than guessing from pack names. Failed payment/metadata reads disable buying. Exact approvals are requested only for the required token(s), and a price update during approval causes the community purchase to revert. Paused, inactive, sold-out, insufficient balance/allowance, and fee-on-transfer failure paths do not mint a pack. Taxed or rebasing tokens are not supported by the exact-receipt design.

## Release requirements

This is updated source, not an upgrade to any existing deployed contract. Compile, test, and deploy a compatible expansion contract, link it to the core, and update the public pack address before enabling purchases. Existing pack balances, IDs, attached expansion weights and core references must be inventoried before migrating a deployed collection; redeploying the packs contract alone does not migrate them. Do not re-run the full-stack deploy script against an existing live collection as a shortcut.

No community pack is seeded automatically. Configure verified Base token addresses, metadata, exact prices, supply and rarity using the owner wallet. The pack creation transaction displays in that wallet for review.

The PDFs' three-outfit bundle claims and persistent Equip/Switch state are separate from this payment change. A purchase in this implementation still mints one ERC-1155 pack ID. It does not pretend to grant three outfit IDs.

## Verification

`npm run compile:contracts` and `npm run build` compile the production contracts and app.

The payment integration test runs the contract in an isolated local EVM with mock ERC-20 tokens. It covers independent treasury receipts, 6/18-decimal tokens, exact quantities, both regular payment tokens, quote changes, invalid routes, access control, cap/pause/inactive guards, transfer-tax rejection, trading and binding burn. The test runner is installed outside the website project and is not bundled into the app.

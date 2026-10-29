# Community wardrobe artwork

Five community wardrobes with three complete renders each are listed in `app/_lib/community-packs.js` and browsable in `app/community-packs.jsx`.

The attire, headwear and effects follow the five Hybrid Expansion Pack specifications. Community face designs were subsequently requested using the user's DOGE, PEPE, SHIB, FLOKI and TOSHI reference images. The character presentation follows the user-supplied FLOKI lineup: sculpted community heads, sleeved arms, compact pencil bodies and graphite points instead of legs. A later instruction removes every Lab background and podium; only characters and their specified aura effects remain. DOGE heads are corrected against the supplied Doge reference. The faces are part of the displayed character renders, not the payment-token verification mechanism.

The gallery does not invent deployed token addresses, pack availability, three-ID claim rights, or an equipped NFT state. Its outfit picker changes the local artwork shown; it does not modify an owned NFT.

Each `lineup.webp` shows all three characters as a transparent character lineup. Assets in `public/assets/community-packs/{community}/{look}.webp` are 512x1024 compressed full-render crops. They are NOT separate transparent face/headwear/apparel/aura layers and must not be passed to the current expansion compositor as independent overlays. Production layer separation and fitting to the two curved base poses remain separate work. Straight-pencil artwork in the gallery does not replace the existing customizer bases.

`package-community-art.py` copies the chosen generated source sheets into the local artwork directory, crops the three renders with their original alpha, and prepares the optimized assets plus a local contact sheet and download archive. It uses Pillow; no generated source PNGs or reference images are shipped in the web bundle.

The public gallery displays one branded foil-pack presentation and one selected character at a time. Community buttons choose the pack; the three outfit buttons and previous/next controls switch its character and trait details. This is artwork browsing, not an on-chain pack opening.

Background cleanup: the three source characters must have independent transparent gutters before cropping, so aura fragments from an adjacent look never appear at the edges of another pack. The pack wrapper uses a flat dark backing; character cutouts retain their own specified effects without a generated scene or fog backdrop.

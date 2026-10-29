# Regular Itty trait layers

24 AI-rendered transparent components, aligned to the three existing pencil poses (72 full-canvas layers). The pencil bases and existing outfit layers are unchanged.

- Expressions: Chill, Hype, Fierce, Glitch, Focused, Relaxed (eyes and brows).
- Mouths: Grin, Smirk, Feral Snarl, Bubble Gum, Gold Grill, Neutral.
- Hair: Obsidian Black, Cyber Blue, Acid Purple, Platinum Silver, Sunset Pink.
- Lips: Glossy Crimson, Electric Magenta, Dark Velvet Plum, Neon Cyan, Matte Nude.
- Accessories: Designer Sunglasses, Semi-Hot Branded Bag.

Review at `/admin/regular-traits`. Changing pose keeps the selected traits and loads its corresponding aligned files. Lips replace the plain mouth; bags enable matching arms. Reset removes all traits. These controls review visual artwork and do not change token metadata or grant on-chain entitlements.

Public assets use compressed WebP. Editable transparent PNGs are in `aligned/`, and the complete PNG archive is `outputs/itty-bitty-regular-trait-layers.zip` at the project root. All aligned files use the same 1024 × 1536 canvas as the base. Rebuild from saved generated sheets using `scripts/build-regular-trait-layers.py` with Pillow and NumPy installed.

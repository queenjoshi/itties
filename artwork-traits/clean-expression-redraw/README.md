# Clean expression redraw

Created with the built-in image generation tool from the five user-supplied reference pencils. Final source: `faces-atlas.png`.

Prompt: Draw six isolated, dimensional brown-eye facial expression overlays (Chill, Hype, Fierce, Glitch, Focused, Relaxed) on transparency. Match the reference eyes, original-sized sculpted brows and readable mouths. No pencil skin, blush, coloured halos or thick drawn outlines. Keep eyes/brows separated from mouths. A second edit removed yellow eyelid skin and gold mouth edges, leaving underlying pencil colour visible through the lids.

`scripts/build-clean-expression-redraw.py` separates independent alpha components and registers them to the three barrel profiles. It does not colour-key a pencil body or paint new outlines. Output: `public/assets/clean-expressions`.

The customizer now consumes these new preset faces on all poses. Superseded facial assets were moved to `artwork-traits/retired-expression-layers`; manual mouth choices and gesture layers remain independent. Legacy first-pose cleanup scripts are historical and do not build this active preset set.

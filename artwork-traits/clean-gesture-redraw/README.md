# Clean 3D gesture redraw

Built-in image generation was used to draw detached yellow arms with soft dimensional white gloves directly on transparency, based on the user's Relaxed, Focused, Glitch, Fierce and Hype references. Chill adds the matching two-hands-on-hips option. Each glove has three fingers and one thumb.

Prompt: Six pairs of isolated arms and gloves, no pencil/face/torso, polished 3D tubes and sculpted gloves, smooth bends and natural cuffs, no coloured outlines, halos or stray pixels, transparent background, consistent proportions.

`scripts/build-clean-gesture-redraw.py` fits each limb to a concealed shoulder anchor on all three poses, separates foreground gloves, extends Focused's vertical forearm while keeping the original glove proportions, and builds all 14 arm colours. Relaxed hands stay behind the head. No body pixels are extracted from reference pencils.

Active output: `public/assets/clean-gestures`. Old active gesture assets were moved into `artwork-traits/retired-gesture-layers`. No production push was performed.

Tilt Right refinement: both limbs rotate around the shoulder centre to follow the local barrel axis. Shoulder heights, hip gloves, raised palms and temple-pointing glove now follow the curve.

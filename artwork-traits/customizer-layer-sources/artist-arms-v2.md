# Arm artwork correction

Created with the built-in imagegen tool from gestures.png, saved as gestures-artist-v2.png.

Prompt: Redraw all six arm pairs with smooth golden-yellow limbs, natural white gloves and rolled cuffs; four fingers plus one thumb on each hand. Preserve shoulder attachment coordinates and the 3-by-2 sprite layout. Chill: hands on hips. Hype: two open palms up. Fierce: hip hand and raised fist. Glitch: finger guns. Focused: finger at temple and hip hand. Relaxed: hands behind head. No pencil, face, labels, background or glow; transparent alpha.

Registration: scripts/build-artist-arms.py produces three pose variants in fourteen body colours. Shoulder endpoints remain below the barrel. Independently registered glove layers sit above the barrel and face where needed. Relaxed hands stay behind the head. Focused and Relaxed attachment heights are adjusted for their gestures.

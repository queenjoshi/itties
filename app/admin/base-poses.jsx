"use client";

import { useState } from "react";
import Link from "next/link";
import { STANDARD_SKINS } from "../_lib/skin-colours";

const poses = [
  { id: "tilt-left", name: "Tilt Left" },
  { id: "tilt-right", name: "Tilt Right" },
  { id: "straight", name: "Straight" }
];
const outfits = [
  ["tropical-neon", "Tropical Neon"],
  ["cherry-blossom-noir", "Cherry Blossom Noir"],
  ["geometric-prism", "Geometric Prism"],
  ["statement-crop-skirt", "Itty Bitty Crop & Skirt"],
  ["neon-mesh", "Neon Mesh"]
];

export default function BasePoses() {
  const [selected, setSelected] = useState(null);
  const [outfit, setOutfit] = useState(null);
  const [arms, setArms] = useState(false);
  const [skin, setSkin] = useState("yellow");
  const pose = poses.find((item) => item.id === selected);

  const baseImage = pose && skin !== "yellow" ? `/assets/pencil-skins/${pose.id}-${skin}.webp?v=clean-edges7` : pose ? `/assets/base-poses/${pose.id}.webp?v=clean-edges7` : "";

  function changePose() {
    setSelected(null);
    setArms(false);
    setSkin("yellow");
    setOutfit(null);
  }

  return (
    <main className="admin-review">
      <header className="admin-review-nav">
        <Link href="/" className="admin-review-brand">ITTY BITTY <span>CUSTOMIZE</span></Link>
        <Link href="/" className="admin-review-back">← Back to the site</Link>
      </header>
      <div className="admin-review-wrap">
        <section className="admin-review-hero">
          <p>{pose ? "STEP 2 OF 2" : "STEP 1 OF 2"}</p>
          <h1>{pose ? <>Choose your <em>layers.</em></> : <>Pick a <em>pose.</em></>}</h1>
          <p>{pose ? `${pose.name} · Select an outfit for this base.` : "Choose your base pencil to see its fitted layers."}</p>
        </section>
        {!pose ? (
          <section className="base-pose-options pose-first-options" aria-label="Choose base pose">
            {poses.map((item) => (
              <button key={item.id} type="button" onClick={() => { setSelected(item.id); setOutfit(null); }}>
                <img src={`/assets/base-poses/${item.id}.webp?v=clean-edges7`} alt={`Blank yellow pencil in ${item.name} pose`} />
                <span>{item.name}</span>
              </button>
            ))}
          </section>
        ) : (
          <section className="base-pose-picker" aria-label={`${pose.name} layers`}>
            <div className="base-pose-preview">
              <div className="pose-layer-stage">
                <img src={baseImage} alt={`${STANDARD_SKINS.find((item) => item.id === skin)?.name} pencil — ${pose.name}`} />
                {outfit && <img key={`${pose.id}-${outfit}`} className="pose-dress-layer" src={`/assets/pose-dresses/${pose.id}-${outfit}.webp?v=clean-edges7`} alt={outfits.find(([id]) => id === outfit)[1]} />}
                {arms && <img className="pose-dress-layer" src={`/assets/arm-traits/${pose.id}-wave-${skin}.webp?v=clean-edges7`} alt={`${skin} arms with five-digit white gloves, waving left hand and right fist`} />}
              </div>
              <strong aria-live="polite">{pose.name}</strong>
              <button className="pose-change-button" type="button" onClick={changePose}>← Change pose</button>
            </div>
            <div className="pose-outfit-controls" aria-label={`Outfits fitted to ${pose.name}`}>
              <div className="trait-panel-heading"><h2>Make it yours.</h2><p>Choose a colour, arms, and an outfit.</p></div>
              <fieldset className="trait-section">
                <legend>01 <span>Pencil colour</span></legend>
                <div className="trait-colours">
                  {STANDARD_SKINS.map(({ id: colour, name }) => <button key={colour} type="button" aria-pressed={skin === colour} onClick={() => setSkin(colour)}><span className={`trait-swatch swatch-${colour}`} aria-hidden="true" /><span>{name}</span></button>)}
                </div>
              </fieldset>
              <fieldset className="trait-section">
                <legend>02 <span>Arms</span></legend>
                <div className="trait-arms">
                  <button type="button" aria-pressed={!arms} onClick={() => setArms(false)}><span>No arms</span><small>Keep it simple</small></button>
                  <button type="button" aria-pressed={arms} onClick={() => setArms(true)}><span>Wave & hip pose</span><small>Matching arms · White gloves</small></button>
                </div>
              </fieldset>
              <fieldset className="trait-section">
                <legend>03 <span>Outfit</span></legend>
                <div className="trait-outfits">
                  {[[null, "No outfit"], ...outfits].map(([id, name]) => (
                    <button key={id || "none"} type="button" aria-pressed={outfit === id} onClick={() => setOutfit(id)}>
                      <span className="pose-outfit-thumb"><img src={baseImage} alt="" />{id && <img src={`/assets/pose-dresses/${pose.id}-${id}.webp?v=clean-edges7`} alt="" />}</span>
                      <span className="trait-card-name">{name}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

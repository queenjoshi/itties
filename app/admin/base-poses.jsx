"use client";

import { useState } from "react";
import Link from "next/link";
import { STANDARD_SKINS } from "../_lib/skin-colours";

const poses = [
  { id: "tilt-left", name: "Tilt Left" },
  { id: "tilt-right", name: "Tilt Right" },
  { id: "straight", name: "Straight" }
];

export default function BasePoses() {
  const [selected, setSelected] = useState(null);
  const [skin, setSkin] = useState("yellow");
  const pose = poses.find(item => item.id === selected);
  return (
    <main className="admin-review">
      <header className="admin-review-nav">
        <Link href="/" className="admin-review-brand">ITTY BITTY <span>BASE PENCILS</span></Link>
        <Link href="/" className="admin-review-back">← Back to the site</Link>
      </header>
      <div className="admin-review-wrap">
        <section className="admin-review-hero">
          <p>BLANK BASES</p>
          <h1>Pick a <em>pose.</em></h1>
          <p>Choose a pose, then choose your pencil colour.</p>
        </section>
        {!pose ? (
          <section className="base-pose-options pose-first-options" aria-label="Choose base pose">
            {poses.map(item => (
              <button key={item.id} type="button" onClick={() => setSelected(item.id)}>
                <img src={`/assets/base-poses/${item.id}.webp?v=clean-edges7`} alt={`Blank yellow pencil in ${item.name} pose`} />
                <span>{item.name}</span>
              </button>
            ))}
          </section>
        ) : (
          <section aria-label={`${pose.name} blank pencil`}>
            <div className="base-pose-preview" style={{ maxWidth: 480, margin: "0 auto" }}>
              <div className="pose-layer-stage">
                <img src={skin === "yellow" ? `/assets/base-poses/${pose.id}.webp?v=clean-edges7` : `/assets/pencil-skins/${pose.id}-${skin}.webp?v=clean-edges7`} alt={`${STANDARD_SKINS.find(item => item.id === skin).name} pencil — ${pose.name}`} />
              </div>
              <strong>{pose.name} · {STANDARD_SKINS.find(item => item.id === skin).name}</strong>
              <fieldset className="trait-section" style={{ width: "100%", marginTop: 20 }}>
                <legend>Pencil colour</legend>
                <div className="trait-colours">{STANDARD_SKINS.map(({id,name}) => <button type="button" key={id} aria-pressed={skin === id} onClick={() => setSkin(id)}><span className={`trait-swatch swatch-${id}`} aria-hidden="true"/><span>{name}</span></button>)}</div>
              </fieldset>
              <button className="pose-change-button" type="button" onClick={() => setSelected(null)}>← Change pose</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

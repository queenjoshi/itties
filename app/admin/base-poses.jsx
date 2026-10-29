"use client";

import { useState } from "react";
import Link from "next/link";
import { STANDARD_SKINS } from "../_lib/skin-colours";

const finishes = [["classic-red","Classic Red"],["polka-dot-pink","Polka-Dot Pink"],["sky-blue-striped","Sky Blue Striped"],["floral","Floral"],["stealth-matte-black","Stealth Matte Black"],["neon-acid","Neon Acid"]];

const poses = [
  { id: "tilt-left", name: "Tilt Left" },
  { id: "tilt-right", name: "Tilt Right" },
  { id: "straight", name: "Straight" }
];

export default function BasePoses() {
  const [selected, setSelected] = useState(null);
  const [skin, setSkin] = useState("yellow");
  const [finish, setFinish] = useState(null);
  const [arms, setArms] = useState(true);
  const pose = poses.find(item => item.id === selected);
  return (
    <main className="admin-review">
      <header className="admin-review-nav">
        <Link href="/" className="admin-review-brand">ITTY BITTY <span>BASE PENCILS</span></Link>
        <Link href="/" className="admin-review-back">← Back to the site</Link>
      </header>
      <div className="admin-review-wrap">
        <section className="admin-review-hero">
          <p>{pose ? "LAYER WORKBENCH" : "CHOOSE YOUR BASE"}</p>
          <h1>{pose ? <>Change your <em>layers.</em></> : <>Pick a <em>pose.</em></>}</h1>
          <p>Choose a pose, a pencil colour, and a body finish.</p>
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
          <section className="customizer-workbench" aria-label={`${pose.name} blank pencil`}>
            <div className="base-pose-preview" >
              <div className="pose-layer-stage">
                <img style={{zIndex:2,visibility: finish ? "hidden" : "visible"}} src={skin === "yellow" ? `/assets/base-poses/${pose.id}.webp?v=clean-edges7` : `/assets/pencil-skins/${pose.id}-${skin}.webp?v=clean-edges7`} alt={`${STANDARD_SKINS.find(item => item.id === skin).name} pencil — ${pose.name}`} />
              {arms && <img style={{zIndex: 1}} className="pose-dress-layer" src={`/assets/arm-traits/${pose.id}-wave-${finish === "classic-red" ? "red" : finish === "polka-dot-pink" ? "pink" : finish === "sky-blue-striped" ? "blue" : finish === "stealth-matte-black" ? "black" : finish === "neon-acid" ? "pepe-green" : skin}.webp?v=clean-edges7`} alt="Matching arms with white gloves"/>}
                {arms && <img style={{zIndex:3}} className="pose-dress-layer" src={`/assets/arm-traits/${pose.id}-hip-glove.webp?v=1`} alt="Hip hand in front of barrel"/>}
                {finish && <img style={{zIndex:2}} className="pose-dress-layer" src={`/assets/body-finishes/${pose.id}/${finish}.webp?v=3`} alt={finishes.find(([id]) => id === finish)[1] + " body finish"}/>}
              </div>
              <strong>{pose.name} · {finish ? finishes.find(([id]) => id === finish)[1] : STANDARD_SKINS.find(item => item.id === skin).name}</strong>
              </div><div className="customizer-controls"><h2>Make it yours.</h2><fieldset className="trait-section" style={{ width: "100%", marginTop: 20 }}>
                <legend>Pencil colour</legend>
                <div className="trait-colours">{STANDARD_SKINS.map(({id,name}) => <button type="button" key={id} aria-pressed={skin === id} onClick={() => { setSkin(id); setFinish(null); }}><span className={`trait-swatch swatch-${id}`} aria-hidden="true"/><span>{name}</span></button>)}</div>
              </fieldset>
              <fieldset className="trait-section" style={{ width: "100%", marginTop: 20 }}><legend>Body finish</legend><p style={{fontSize:12,color:"#b9a7c5"}}>A printed finish replaces the barrel colour.</p><div className="trait-colours">{[[null,"Plain colour"],...finishes].map(([id,name]) => <button type="button" key={id || "plain"} aria-pressed={finish === id} onClick={() => setFinish(id)}><span>{name}</span></button>)}</div></fieldset>
              <fieldset className="trait-section"><legend>Arms & hands</legend><div className="trait-colours"><button type="button" aria-pressed={arms} onClick={() => setArms(true)}>Wave & hip pose</button><button type="button" aria-pressed={!arms} onClick={() => setArms(false)}>No arms</button></div></fieldset>
              <button className="pose-change-button" type="button" onClick={() => setSelected(null)}>← Change pose</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

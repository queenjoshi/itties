"use client";

import { useState } from "react";
import Link from "next/link";
import manifest from "../../public/assets/regular-traits/manifest.json";
import { STANDARD_SKINS } from "../_lib/skin-colours";

const names = { expressions: "Expression · Eyes & brows", mouths: "Mouth", hair: "Hair", lips: "Lip colour", accessories: "Accessories" };
const poses = [["straight", "Straight"], ["tilt-left", "Tilt Left"], ["tilt-right", "Tilt Right"]];
const root = "/assets/regular-traits";

export default function RegularTraitsStudio() {
  const [pose, setPose] = useState("straight");
  const [skin, setSkin] = useState("yellow");
  const [selected, setSelected] = useState({ expressions: "chill", mouths: "smirk", hair: null, lips: null });
  const [sunglasses, setSunglasses] = useState(false);
  const [bag, setBag] = useState(false);
  const [arms, setArms] = useState(false);
  const base = skin === "yellow" ? `/assets/base-poses/${pose}.webp?v=clean-edges7` : `/assets/pencil-skins/${pose}-${skin}.webp?v=clean-edges7`;
  const layer = (category, id) => `${root}/${pose}/${category}/${id}.webp?v=regular1`;
  const imageLayers = [
    selected.hair && ["hair", selected.hair],
    selected.expressions && ["expressions", selected.expressions],
    selected.lips ? ["lips", selected.lips] : selected.mouths && ["mouths", selected.mouths],
    sunglasses && ["accessories", "designer-sunglasses"],
    bag && ["accessories", "semi-hot-bag"]
  ].filter(Boolean);

  function choose(category, id) {
    if (category === "accessories") {
      if (id === "designer-sunglasses") setSunglasses(value => !value);
      else { setBag(value => !value); if (!bag) setArms(true); }
      return;
    }
    setSelected(value => ({ ...value, [category]: value[category] === id ? null : id, ...(category === "mouths" ? { lips: null } : {}) }));
  }
  function active(category, id) {
    if (category === "accessories") return id === "designer-sunglasses" ? sunglasses : bag;
    return selected[category] === id && !(category === "mouths" && selected.lips);
  }
  function clearTraits() {
    setSelected({ expressions: null, mouths: null, hair: null, lips: null }); setSunglasses(false); setBag(false); setArms(false);
  }

  return <main className="admin-review regular-trait-studio">
    <header className="admin-review-nav"><Link href="/admin" className="admin-review-brand">ITTY BITTY <span>TRAIT STUDIO</span></Link><Link href="/admin" className="admin-review-back">← Back to customizer</Link></header>
    <div className="admin-review-wrap">
      <section className="admin-review-hero"><p>REGULAR ITTY · TRANSPARENT LAYERS</p><h1>Give it <em>character.</em></h1><p>Mix expressions, mouths, hair, lips, and accessories on your pencil.</p></section>
      <div className="regular-trait-workspace">
        <section className="base-pose-preview regular-trait-preview" aria-label="Layered trait preview">
          <div className="regular-pose-switch" role="group" aria-label="Pencil pose">{poses.map(([id,name]) => <button type="button" key={id} aria-pressed={pose===id} onClick={() => setPose(id)}>{name}</button>)}</div>
          <div className="pose-layer-stage"><img src={base} alt={`${STANDARD_SKINS.find(item => item.id===skin).name} ${poses.find(([id])=>id===pose)[1]} pencil base`}/>{imageLayers.map(([category,id]) => <img key={`${category}-${id}`} className="pose-dress-layer" src={layer(category,id)} alt={manifest.categories[category].find(item=>item.id===id).name}/>)}{arms && <img className="pose-dress-layer" src={`/assets/arm-traits/${pose}-wave-${skin}.webp?v=clean-edges7`} alt="Matching arms and white gloves"/>}</div>
          <label className="regular-arm-control"><input type="checkbox" checked={arms} onChange={event=>setArms(event.target.checked)}/> Show arms</label>
          <button type="button" className="pose-change-button" onClick={clearTraits}>Reset to blank</button>
          <p className="regular-layer-note">Visual trait review · Selections do not update NFT metadata.</p>
        </section>
        <div className="regular-trait-controls">
          <fieldset className="trait-section"><legend><span>Pencil colour</span></legend><div className="trait-colours">{STANDARD_SKINS.map(({id,name})=><button type="button" key={id} aria-pressed={skin===id} onClick={()=>setSkin(id)}><span className={`trait-swatch swatch-${id}`} aria-hidden="true"/><span>{name}</span></button>)}</div></fieldset>
          {Object.entries(manifest.categories).map(([category,options])=><fieldset key={category} className="trait-section"><legend><span>{names[category]}</span></legend><div className="regular-trait-options">{options.map(option=><button type="button" key={option.id} aria-pressed={active(category,option.id)} onClick={()=>choose(category,option.id)}><img src={`${root}/${option.component}`} alt="" width="360" height="360"/><span>{option.name}</span></button>)}</div></fieldset>)}
        </div>
      </div>
    </div>
  </main>;
}

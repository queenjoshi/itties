"use client";

import { useState } from "react";
import { COMMUNITY_PACKS } from "./_lib/community-packs";

export default function CommunityPacks() {
  const [packId, setPackId] = useState("pepe");
  const [lookIndex, setLookIndex] = useState(0);
  const pack = COMMUNITY_PACKS.find(item => item.id === packId);
  const look = pack.looks[lookIndex];
  const moveLook = direction => setLookIndex(index => (index + direction + pack.looks.length) % pack.looks.length);

  return <section id="expansions" className="community-wardrobes" aria-labelledby="community-wardrobes-title">
    <div className="community-wardrobes-heading"><div><p className="eyebrow">THE ITTIES · COMMUNITY PACKS</p><h3 id="community-wardrobes-title">Pick your <em>pack.</em></h3></div><p>Five communities. Three signature looks per pack.<br/>Explore one look at a time.</p></div>
    <div className="community-pack-tabs" role="group" aria-label="Choose expansion pack">{COMMUNITY_PACKS.map(item => <button key={item.id} type="button" aria-pressed={item.id === packId} onClick={() => {setPackId(item.id);setLookIndex(0);}} style={{"--pack-colour":item.colour}}><span aria-hidden="true"/>{item.name}</button>)}</div>
    <div className="single-pack-showcase" style={{"--pack-colour":pack.colour}}>
      <div className="single-pack-display">
        <figure className="community-foil-pack">
          <div className="pack-seal" aria-hidden="true"/>
          <div className="foil-pack-heading"><span>THE ITTIES</span><small>COMMUNITY SERIES {pack.series}</small><strong>{pack.name}</strong><span>EXPANSION PACK</span></div>
          <div className="foil-pack-art"><img key={`${pack.id}-${look.id}`} src={`/assets/community-packs/${pack.id}/${look.id}.webp?v=clean-pack2`} alt={`${pack.name} pack: one ${pack.face} pencil character wearing ${look.attire}, ${look.headwear}, with ${look.aura}`} width="512" height="1024"/></div>
          <figcaption><span>LOOK {String(lookIndex+1).padStart(2,"0")} / 03</span><strong>{look.name}</strong><small>3 SIGNATURE LOOKS · {pack.name} COLLECTION</small></figcaption>
          <div className="pack-seal" aria-hidden="true"/>
        </figure>
        <div className="single-pack-navigation" aria-label="Browse pack looks"><button type="button" onClick={() => moveLook(-1)} aria-label="Previous look">←</button><span aria-live="polite">Look {lookIndex+1} of {pack.looks.length}</span><button type="button" onClick={() => moveLook(1)} aria-label="Next look">→</button></div>
      </div>
      <div className="single-pack-information">
        <p className="eyebrow">SERIES {pack.series} · COMMUNITY WARDROBE</p><h4>{pack.name}<br/>Expansion Pack</h4><p className="single-pack-description">Three coordinated looks, each with its own outfit, headwear, and aura. Choose a look to see it on the pack.</p>
        <div className="single-pack-looks" role="group" aria-label={`${pack.name} looks`}>{pack.looks.map((item,index) => <button key={item.id} type="button" aria-pressed={lookIndex===index} onClick={() => setLookIndex(index)}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.name}</strong><span aria-hidden="true">{lookIndex===index ? "✓" : "↗"}</span></button>)}</div>
        <dl className="community-look-traits single-pack-traits" aria-live="polite"><div><dt>Face</dt><dd>{pack.face}</dd></div><div><dt>Outfit</dt><dd>{look.attire}</dd></div><div><dt>Headwear</dt><dd>{look.headwear}</dd></div><div><dt>Aura & effects</dt><dd>{look.aura}</dd></div></dl>
        <details className="community-release-details"><summary>Artwork & purchase availability</summary><p>Pack artwork preview. Intended payment: ${pack.token}. Purchases open after this pack’s verified Base token and contract allocation are published. The planned three-outfit unlock is not yet enabled.</p><a href="#pack-market">Check available packs ↗</a></details>
      </div>
    </div>
  </section>;
}

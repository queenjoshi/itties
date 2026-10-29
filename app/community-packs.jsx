"use client";

import { useState } from "react";
import { COMMUNITY_PACKS } from "./_lib/community-packs";

export default function CommunityPacks() {
  const [packId, setPackId] = useState("pepe");
  const [lookIndex, setLookIndex] = useState(0);
  const pack = COMMUNITY_PACKS.find(item => item.id === packId);
  const look = pack.looks[lookIndex];
  return <section id="expansions" className="community-wardrobes" aria-labelledby="community-wardrobes-title">
    <div className="community-wardrobes-heading"><div><p className="eyebrow">COMMUNITY WARDROBES · 15 LOOKS</p><h3 id="community-wardrobes-title">Find your <em>tribe.</em></h3></div><p>Five communities. Three signature looks each.<br/>Explore the outfits, headwear, and effects.</p></div>
    <div className="community-pack-tabs" role="group" aria-label="Choose community wardrobe">{COMMUNITY_PACKS.map(item => <button key={item.id} type="button" aria-pressed={item.id === packId} onClick={() => {setPackId(item.id);setLookIndex(0);}} style={{"--pack-colour":item.colour}}><span aria-hidden="true"/>{item.name}</button>)}</div>
    <div className="community-showcase" style={{"--pack-colour":pack.colour}}>
      <figure className="community-lineup"><img key={pack.id} src={`/assets/community-packs/${pack.id}/lineup.webp?v=transparent3`} alt={`Three ${pack.name} pencil characters with ${pack.face} faces in their ${pack.looks.map(item => item.name).join(", ")} outfits on transparent backgrounds`} width="1536" height="1024"/><figcaption>{pack.name} · SERIES {pack.series} · THREE SIGNATURE LOOKS</figcaption></figure>
      <div className="community-lineup-choices" role="group" aria-label={`${pack.name} look details`}>{pack.looks.map((item,index) => <button key={item.id} type="button" aria-pressed={lookIndex===index} onClick={() => setLookIndex(index)}><span>{String(index+1).padStart(2,"0")}</span><strong>{item.name}</strong><small>{lookIndex===index ? "Viewing details" : "View details"}</small></button>)}</div>
      <div className="community-selected-look" aria-live="polite"><div><p className="eyebrow">{pack.name} EXPANSION PACK</p><h4>{look.name}</h4></div><dl className="community-look-traits"><div><dt>Face</dt><dd>{pack.face}</dd></div><div><dt>Outfit</dt><dd>{look.attire}</dd></div><div><dt>Headwear</dt><dd>{look.headwear}</dd></div><div><dt>Aura & effects</dt><dd>{look.aura}</dd></div></dl></div>
      <details className="community-release-details"><summary>Artwork & purchase availability</summary><p>These are wardrobe artworks with your community’s face. Intended payment: ${pack.token}. Purchases open after this pack’s verified Base token and contract allocation are published. The planned three-outfit unlock is not yet enabled.</p><a href="#pack-market">Check available packs ↗</a></details>
    </div>
  </section>;
}

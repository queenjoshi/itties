"use client";

import { useState } from "react";
import Link from "next/link";
import { STANDARD_SKINS, NEON_SKINS, PENCIL_COLOURS } from "../_lib/skin-colours";

const erasers = [["standard-pink","Standard Pink"],["blackout","Blackout"],["crimson-red","Crimson Red"],["electric-blue","Electric Blue"],["gold-metal-band","Gold Metal Band"],["neon-purple","Neon Purple"]];
const motions = [["static","Static"],["neon-glow-pulse","Neon Glow Pulse"],["silver-glitter","Silver Glitter"],["glitch-overlay","Glitch Overlay"],["floating-bob","Floating Bob"],["gold-shimmer","Gold Shimmer"]];
const eyeNames = ["Confident","Wide-Eyed","Designer Shades","Wild Stare","Cyber Visor","Wink"];
const mouthNames = {male:["Grin","Smirk","Feral Snarl","Bubble Gum","Gold Grill","Neutral"],female:["Glossy Crimson","Electric Magenta","Dark Velvet Plum","Neon Cyan","Matte Nude","Natural Smile"]};
const expressions = [
  {id:"chill",name:"Chill"},{id:"hype",name:"Hype"},{id:"fierce",name:"Fierce"},
  {id:"glitch",name:"Glitch"},{id:"focused",name:"Focused"},{id:"relaxed",name:"Relaxed"}
];
const wearables = [["gold-joshi-medallion","Gold Joshi Medallion"],["dollar-chain","Dollar Chain"]];
const patterns = [["floral","Flowers"],["polka-dots","White polka dots"],["stripes","Stripes"],["matte","Matte"]];

const poses = [
  { id: "tilt-left", name: "Tilt Left" },
  { id: "tilt-right", name: "Tilt Right" },
  { id: "straight", name: "Straight" }
];

export default function BasePoses() {
  const [selected, setSelected] = useState(null);
  const [skin, setSkin] = useState("yellow");
  const [eraser, setEraser] = useState("standard-pink");
  const [motion, setMotion] = useState("static");
  const [pattern, setPattern] = useState(null);
  const [colourGroup, setColourGroup] = useState("regular");
  const [arms, setArms] = useState(false);
  const [gesture, setGesture] = useState("hype");
  const [jewellery, setJewellery] = useState(null);
  const [gender, setGender] = useState(null);
  const [faces, setFaces] = useState({male:{eyes:null,mouth:null,expression:null},female:{eyes:null,mouth:null,expression:null}});
  function resetLayers() {
    setSkin("yellow");
    setEraser("standard-pink");
    setMotion("static");
    setPattern(null);
    setColourGroup("regular");
    setArms(false);
    setGesture("hype");
    setJewellery(null);
    setFaces({male:{eyes:null,mouth:null,expression:null},female:{eyes:null,mouth:null,expression:null}});
  }
  function startItty(type = null) {
    resetLayers();
    setSelected(null);
    setGender(type);
  }
  function choosePose(id) {
    if (id === selected) return;
    resetLayers();
    setSelected(id);
  }
  const availableExpressions = expressions;
  function chooseFace(category,id){setFaces(previous=>({...previous,[gender]:{...previous[gender],[category]:id,expression:null}}));}
  function chooseExpression(id){
    const preset=availableExpressions.find(item=>item.id===id);
    setFaces(previous=>({...previous,[gender]:preset ? {eyes:id,mouth:id,expression:id} : {eyes:null,mouth:null,expression:null}}));
    if(preset){setArms(true);setGesture(id);}
  }
  const firstPose = selected === "tilt-left";
  const pose = poses.find(item => item.id === selected);
  return (
    <main className="admin-review">
      <header className="admin-review-nav">
        <Link href="/" className="admin-review-brand">ITTY BITTY <span>BASE PENCILS</span></Link>
        <Link href="/" className="admin-review-back">← Back to the site</Link>
      </header>
      <div className="admin-review-wrap">
        <section className="admin-review-hero">
          <p>{!gender ? "01 · CHOOSE YOUR ITTY" : !pose ? "02 · CHOOSE YOUR POSE" : "03 · CUSTOMIZE YOUR ITTY"}</p>
          <h1>{!gender ? <>Choose your <em>Itty.</em></> : pose ? <>Change your <em>layers.</em></> : <>Pick a <em>pose.</em></>}</h1>
          <p>{!gender ? "Start with a male or female Itty to see its trait options. Changing Itty type starts a fresh selection." : `${gender === "male" ? "Male" : "Female"} Itty · Choose your lifelong pencil, then build its look with layers.`}</p>
          {gender && <button type="button" className="pose-change-button" onClick={()=>startItty()}>← Change Itty type</button>}
        </section>
        {!gender ? (
          <section className="itty-type-options" aria-label="Choose male or female Itty">
            {["male","female"].map(value=><button key={value} type="button" onClick={()=>startItty(value)}><span className="itty-type-step">START HERE</span><strong>{value === "male" ? "Male Itty" : "Female Itty"}</strong><span>Explore {value} traits</span><span aria-hidden="true">Choose Itty →</span></button>)}
          </section>
        ) : !pose ? (
          <section className="base-pose-options pose-first-options" aria-label="Choose base pose">
            {poses.map(item => (
              <button key={item.id} type="button" onClick={() => choosePose(item.id)}>
                <img src={`/assets/base-poses/${item.id}.webp?v=clean-edges7`} alt={`Blank yellow pencil in ${item.name} pose`} />
                <span>{item.name}</span>
              </button>
            ))}
          </section>
        ) : (
          <section className="customizer-workbench" aria-label={`${pose.name} pencil customizer`}>
            <div className="base-pose-preview" >
              <div className={`pose-layer-stage motion-${motion}`}><div className="character-stack">
                <img style={{zIndex:2}} src={skin === "yellow" ? `/assets/base-poses/${pose.id}.webp?v=clean-edges7` : `/assets/pencil-skins/${pose.id}-${skin}.webp?v=clean-edges7`} alt={`${PENCIL_COLOURS.find(item => item.id === skin).name} pencil — ${pose.name}`} />
              {arms && <><img style={{zIndex:1}} className="pose-dress-layer" src={firstPose ? `/assets/first-pose-expressions/${gesture}-arms-${skin}.webp?v=6` : `/assets/artist-arms/${pose.id}/${gesture}-${skin}.webp?v=5`} alt={`${gesture} arms`}/><img style={{zIndex:7}} className="pose-dress-layer" src={firstPose ? `/assets/first-pose-expressions/${gesture}-hands.webp?v=6` : `/assets/artist-arms/${pose.id}/${gesture}-hands.webp?v=5`} alt={`${gesture} white-gloved hands`}/></>}
                {["eyes","mouth"].map(category=>faces[gender][category]!==null&&<img key={category} style={{zIndex:6}} className="pose-dress-layer" src={firstPose && typeof faces[gender][category] === "string" ? `/assets/first-pose-expressions/${faces[gender][category]}-${category}.webp?v=6` : typeof faces[gender][category] === "string" ? `/assets/expression-gestures/${gender}/${pose.id}/${faces[gender][category]}-${category}.webp?v=1` : `/assets/expression-gestures/${gender}/${pose.id}/manual-mouth/${faces[gender][category]}.webp?v=1`} alt={`${gender} ${category} — ${typeof faces[gender][category] === "string" ? expressions.find(item=>item.id===faces[gender][category]).name : mouthNames[gender][faces[gender][category]]}`}/>)}
                {[jewellery].filter(Boolean).map(id=><img key={id} style={{zIndex:5}} className="pose-dress-layer" src={`/assets/fitted-traits/${pose.id}/outfits/${id}.webp?v=1`} alt={wearables.find(([key])=>key===id)[1]}/>)}
                {pattern && <div className={`body-pattern-layer pattern-${pattern}`} role="img" aria-label={`${patterns.find(([id])=>id===pattern)[1]} over ${PENCIL_COLOURS.find(item=>item.id===skin).name}`} style={{"--barrel-mask":`url(/assets/body-patterns/${pose.id}-mask.png)`,"--stripe-image":`url(/assets/body-patterns/${pose.id}-stripes.svg)`,"--body-image":`url(${skin === "yellow" ? `/assets/base-poses/${pose.id}.webp` : `/assets/pencil-skins/${pose.id}-${skin}.webp`})`}}/>}
                <img style={{zIndex:3}} className="pose-dress-layer" src={`/assets/eraser-bands/${pose.id}/${eraser}.webp?v=2`} alt={erasers.find(([id])=>id===eraser)[1]}/>
                </div>{["silver-glitter","gold-shimmer"].includes(motion)&&<img className="motion-overlay" src={`/assets/motion-effects/${motion}.webp`} alt={`${motions.find(([id])=>id===motion)[1]} effect`}/>}
              </div>
              <p className="face-expression-note">Changing pose clears all layers so you can start fresh.</p><div className="preview-pose-switch" role="group" aria-label="Change pencil pose">{poses.map(item=><button key={item.id} type="button" aria-pressed={selected===item.id} onClick={()=>choosePose(item.id)}>{item.name}</button>)}</div>
              <strong>{pose.name} · {PENCIL_COLOURS.find(item => item.id === skin).name}{pattern ? ` · ${patterns.find(([id])=>id===pattern)[1]}` : ""}</strong>
              </div><div className="customizer-controls"><h2>{gender === "male" ? "Male" : "Female"} Itty layers</h2><fieldset className="trait-section" style={{ width: "100%", marginTop: 20 }}>
                <legend>Body colour (skin colour)</legend>
                <p className="pencil-lifetime-note"><strong>Your pencil for life.</strong> The pencil you pick is your Itty’s pencil for life. Its base skin colour is permanent after minting. To choose a different pencil colour, you’ll need a new Itty.</p>
                <div className="colour-group-switch" role="group" aria-label="Body colour groups">{[["regular","Regular"],["neon","Neon"],["patterns","Patterns"]].map(([id,name])=><button key={id} type="button" aria-pressed={colourGroup===id} onClick={()=>setColourGroup(id)}>{name}</button>)}</div>
                {colourGroup !== "patterns" ? <div className="trait-colours">{(colourGroup === "neon" ? NEON_SKINS : STANDARD_SKINS).map(({id,name}) => <button type="button" key={id} aria-pressed={skin === id} onClick={() => setSkin(id)}><span className={`trait-swatch swatch-${id}`} aria-hidden="true"/><span>{name}</span></button>)}</div> : <><p className="face-expression-note">Patterns sit over your chosen pencil colour. Preview a pattern without replacing the base.</p><div className="trait-colours">{[[null,"None"],...patterns].map(([id,name])=><button type="button" key={id||"none"} aria-pressed={pattern===id} onClick={()=>setPattern(id)}>{name}</button>)}</div></>}
              </fieldset>
              <fieldset className="trait-section"><legend>Eraser / band</legend><div className="face-trait-options">{erasers.map(([id,name])=><button type="button" key={id} aria-pressed={eraser===id} onClick={()=>setEraser(id)}>{name}</button>)}</div></fieldset>
              <fieldset className="trait-section"><legend>{gender === "male" ? "Male" : "Female"} expressions</legend><p className="face-expression-note">Choose an expression to apply its matching face and hand gesture.</p><div className="face-trait-options"><button type="button" aria-pressed={faces[gender].eyes===null&&faces[gender].mouth===null} onClick={()=>chooseExpression(null)}>Blank face</button>{availableExpressions.map(item=><button key={item.id} type="button" aria-pressed={faces[gender].expression===item.id} onClick={()=>chooseExpression(item.id)}><img src={firstPose ? `/assets/first-pose-expressions/${item.id}-thumb.webp?v=6` : `/assets/expression-gestures/${gender}/thumbs/${item.id}.webp?v=1`} alt=""/><span>{item.name}</span></button>)}</div></fieldset>
              <fieldset className="trait-section"><legend>{gender === "male" ? "Male" : "Female"} mouths</legend><div className="face-trait-options"><button type="button" aria-pressed={faces[gender].mouth===null} onClick={()=>chooseFace("mouth",null)}>None</button>{mouthNames[gender].map((name,id)=><button key={id} type="button" aria-pressed={faces[gender].mouth===id} onClick={()=>chooseFace("mouth",id)}><img src={`/assets/faces/${gender}/thumbs/mouth/${id}.webp`} alt=""/><span>{name}</span></button>)}</div></fieldset>

              {[["Jewellery",wearables,jewellery,setJewellery]].map(([title,options,value,setValue])=><fieldset key={title} className="trait-section"><legend>{title}</legend><div className="face-trait-options">{[[null,"None"],...options].map(([id,name])=><button key={id||"none"} type="button" aria-pressed={value===id} onClick={()=>setValue(id)}>{id&&<img src={`/assets/fitted-traits/thumbs/${id}.webp?v=1`} alt=""/>}<span>{name}</span></button>)}</div></fieldset>)}
              <fieldset className="trait-section"><legend>Arms & hands</legend><div className="trait-colours"><button type="button" aria-pressed={!arms} onClick={()=>setArms(false)}>No arms</button>{expressions.map(item=><button type="button" key={item.id} aria-pressed={arms&&gesture===item.id} onClick={()=>{setArms(true);setGesture(item.id);}}>{item.name}</button>)}</div></fieldset>
              <fieldset className="trait-section"><legend>Motion effects</legend><div className="face-trait-options">{motions.map(([id,name])=><button type="button" key={id} aria-pressed={motion===id} onClick={()=>setMotion(id)}>{name}</button>)}</div></fieldset>
              <button className="pose-change-button" type="button" onClick={() => choosePose(null)}>← Change pose</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

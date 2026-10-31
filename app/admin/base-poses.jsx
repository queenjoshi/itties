"use client";

import { useState } from "react";
import Link from "next/link";
import { STANDARD_SKINS } from "../_lib/skin-colours";

const erasers = [["standard-pink","Standard Pink"],["blackout","Blackout"],["crimson-red","Crimson Red"],["electric-blue","Electric Blue"],["gold-metal-band","Gold Metal Band"],["neon-purple","Neon Purple"]];
const motions = [["static","Static"],["neon-glow-pulse","Neon Glow Pulse"],["particle-dust","Particle Dust"],["glitch-overlay","Glitch Overlay"],["floating-bob","Floating Bob"],["gold-shimmer","Gold Shimmer"]];
const eyeNames = ["Confident","Wide-Eyed","Designer Shades","Wild Stare","Cyber Visor","Wink"];
const mouthNames = {male:["Grin","Smirk","Feral Snarl","Bubble Gum","Gold Grill","Neutral"],female:["Glossy Crimson","Electric Magenta","Dark Velvet Plum","Neon Cyan","Matte Nude","Natural Smile"]};
const expressions = [
  {id:"chill",name:"Chill",eyes:0,male:1,female:2},
  {id:"hype",name:"Hype",eyes:1,male:0,female:0},
  {id:"fierce",name:"Fierce",eyes:3,male:2,female:2},
  {id:"glitch",name:"Glitch",eyes:4,male:1,female:3},
  {id:"focused",name:"Focused",eyes:0,male:5,female:4},
  {id:"relaxed",name:"Relaxed",eyes:5,male:1,female:5}
];
const femaleExpressions = [
  {id:"confident",name:"Confident",eyes:0,female:0},
  {id:"wide-eyed",name:"Wide-Eyed",eyes:1,female:0},
  {id:"designer-shades",name:"Designer Shades",eyes:2,female:2},
  {id:"wild-stare",name:"Wild Stare",eyes:3,female:3},
  {id:"cyber-visor",name:"Cyber Visor",eyes:4,female:0},
  {id:"wink",name:"Wink",eyes:5,female:5}
];
const wearables = [["gold-joshi-medallion","Gold Joshi Medallion"],["dollar-chain","Dollar Chain"]];
const finishes = [["classic-red","Classic Red"],["polka-dot-pink","Polka-Dot Pink"],["sky-blue-striped","Sky Blue Striped"],["floral","Floral"],["stealth-matte-black","Stealth Matte Black"],["neon-acid","Neon Acid"]];

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
  const [finish, setFinish] = useState(null);
  const [arms, setArms] = useState(true);
  const [hipHand, setHipHand] = useState("rest");
  const [jewellery, setJewellery] = useState(null);
  const [gender, setGender] = useState("male");
  const [faces, setFaces] = useState({male:{eyes:1,mouth:0,expression:"hype"},female:{eyes:1,mouth:0,expression:"wide-eyed"}});
  const availableExpressions = gender === "female" ? femaleExpressions : expressions;
  function chooseFace(category,id){setFaces(previous => ({...previous,[gender]:{...previous[gender],[category]:id,expression:null}}));}
  function chooseExpression(id){const preset=availableExpressions.find(item=>item.id===id);setFaces(previous=>({...previous,[gender]:preset ? {eyes:preset.eyes,mouth:preset[gender],expression:id} : {eyes:null,mouth:null,expression:null}}));}
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
          <section className="customizer-workbench" aria-label={`${pose.name} pencil customizer`}>
            <div className="base-pose-preview" >
              <div className={`pose-layer-stage motion-${motion}`}><div className="character-stack">
                <img style={{zIndex:2,visibility: finish ? "hidden" : "visible"}} src={skin === "yellow" ? `/assets/base-poses/${pose.id}.webp?v=clean-edges7` : `/assets/pencil-skins/${pose.id}-${skin}.webp?v=clean-edges7`} alt={`${STANDARD_SKINS.find(item => item.id === skin).name} pencil — ${pose.name}`} />
              {arms && <img style={{zIndex: 1}} className="pose-dress-layer" src={finish ? `/assets/body-finishes/${pose.id}/${finish}-arms.webp?v=restored10` : `/assets/arm-traits/${pose.id}-wave-${skin}.webp?v=restored10`} alt="Matching arms with white gloves"/>}
                {arms && <img style={{zIndex:5}} className="pose-dress-layer" src={`/assets/arm-traits/${pose.id}-hip-${hipHand === "rest" ? "rest" : "glove"}.webp?v=restored10`} alt="Hip hand in front of barrel"/>}
                {["eyes","mouth"].map(category => faces[gender][category] !== null && <img key={`${gender}-${category}`} style={{zIndex:6}} className="pose-dress-layer" src={`/assets/faces/${gender}/${pose.id}/${category}/${faces[gender][category]}.webp?v=2`} alt={`${gender} ${category} — ${(category === "eyes" ? eyeNames : mouthNames[gender])[faces[gender][category]]}`}/>)}
                {[jewellery].filter(Boolean).map(id=><img key={id} style={{zIndex:5}} className="pose-dress-layer" src={`/assets/male-wearables/${pose.id}/${id}.webp?v=fit7`} alt={wearables.find(([key])=>key===id)[1]}/>)}
                {finish && <img style={{zIndex:2}} className="pose-dress-layer" src={`/assets/body-finishes/${pose.id}/${finish}.webp?v=restored10`} alt={finishes.find(([id]) => id === finish)[1] + " body finish"}/>}
                <img style={{zIndex:3}} className="pose-dress-layer" src={`/assets/eraser-bands/${pose.id}/${eraser}.webp?v=2`} alt={erasers.find(([id])=>id===eraser)[1]}/>
                </div>{["particle-dust","gold-shimmer"].includes(motion)&&<img className="motion-overlay" src={`/assets/motion-effects/${motion}.webp`} alt={`${motions.find(([id])=>id===motion)[1]} effect`}/>}
              </div>
              <div className="preview-pose-switch" role="group" aria-label="Change pencil pose">{poses.map(item=><button key={item.id} type="button" aria-pressed={selected===item.id} onClick={()=>setSelected(item.id)}>{item.name}</button>)}</div>
              <fieldset className="trait-section"><legend>{gender === "male" ? "Male" : "Female"} expression</legend><p className="face-expression-note">Choose a coordinated eye and mouth pair, or mix the layers below.</p><div className="face-trait-options"><button type="button" aria-pressed={faces[gender].eyes===null && faces[gender].mouth===null} onClick={()=>chooseExpression(null)}>Blank face</button>{availableExpressions.map(option=><button key={option.id} type="button" aria-pressed={faces[gender].expression===option.id} onClick={()=>chooseExpression(option.id)}><img src={`/assets/faces/${gender}/${pose.id}/expressions/${option.id}.webp`} alt=""/><span>{option.name}</span></button>)}</div></fieldset>
              <strong>{pose.name} · {finish ? finishes.find(([id]) => id === finish)[1] : STANDARD_SKINS.find(item => item.id === skin).name}</strong>
              </div><div className="customizer-controls"><h2>Make it yours.</h2><fieldset className="trait-section" style={{ width: "100%", marginTop: 20 }}>
                <legend>Pencil colour</legend>
                <div className="trait-colours">{STANDARD_SKINS.map(({id,name}) => <button type="button" key={id} aria-pressed={skin === id} onClick={() => { setSkin(id); setFinish(null); }}><span className={`trait-swatch swatch-${id}`} aria-hidden="true"/><span>{name}</span></button>)}</div>
              </fieldset>
              <fieldset className="trait-section" style={{ width: "100%", marginTop: 20 }}><legend>Body finish</legend><p style={{fontSize:12,color:"#b9a7c5"}}>A printed finish replaces the barrel colour.</p><div className="trait-colours">{[[null,"Plain colour"],...finishes].map(([id,name]) => <button type="button" key={id || "plain"} aria-pressed={finish === id} onClick={() => setFinish(id)}><span>{name}</span></button>)}</div></fieldset>
              <fieldset className="trait-section"><legend>Eraser / band</legend><div className="face-trait-options">{erasers.map(([id,name])=><button type="button" key={id} aria-pressed={eraser===id} onClick={()=>setEraser(id)}>{name}</button>)}</div></fieldset>
              <fieldset className="trait-section"><legend>Face style</legend><div className="trait-colours">{["male","female"].map(value=><button key={value} type="button" aria-pressed={gender===value} onClick={()=>setGender(value)}>{value === "male" ? "Male" : "Female"}</button>)}</div></fieldset>
              {["eyes","mouth"].map(category=><fieldset key={category} className="trait-section"><legend>{gender === "male" ? "Male" : "Female"} {category === "eyes" ? "eyes" : "mouths"}</legend><div className="face-trait-options"><button type="button" aria-pressed={faces[gender][category]===null} onClick={()=>chooseFace(category,null)}>None</button>{(category === "eyes" ? eyeNames : mouthNames[gender]).map((name,id)=><button key={id} type="button" aria-pressed={faces[gender][category]===id} onClick={()=>chooseFace(category,id)}><img src={`/assets/faces/${gender}/thumbs/${category}/${id}.webp`} alt=""/><span>{name}</span></button>)}</div></fieldset>)}
              {[["Jewellery",wearables,jewellery,setJewellery]].map(([title,options,value,setValue])=><fieldset key={title} className="trait-section"><legend>{title}</legend><div className="face-trait-options">{[[null,"None"],...options].map(([id,name])=><button key={id||"none"} type="button" aria-pressed={value===id} onClick={()=>setValue(id)}>{id&&<img src={`/assets/male-wearables/thumbs/${id}.webp?v=fit7`} alt=""/>}<span>{name}</span></button>)}</div></fieldset>)}
              <fieldset className="trait-section"><legend>Arms & hands</legend><div className="trait-colours"><button type="button" aria-pressed={arms} onClick={() => setArms(true)}>Wave & hip pose</button><button type="button" aria-pressed={!arms} onClick={() => setArms(false)}>No arms</button></div></fieldset>
              {arms && <fieldset className="trait-section"><legend>Hip hand</legend><div className="trait-colours"><button type="button" aria-pressed={hipHand==="rest"} onClick={()=>setHipHand("rest")}>Relaxed hand on hip</button><button type="button" aria-pressed={hipHand==="fist"} onClick={()=>setHipHand("fist")}>Curled fist</button></div></fieldset>}
              <fieldset className="trait-section"><legend>Motion effects</legend><div className="face-trait-options">{motions.map(([id,name])=><button type="button" key={id} aria-pressed={motion===id} onClick={()=>setMotion(id)}>{name}</button>)}</div></fieldset>
              <button className="pose-change-button" type="button" onClick={() => setSelected(null)}>← Change pose</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

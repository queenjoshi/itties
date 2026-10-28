"use client";

import { useState } from "react";

const categories = [
  {
    id: "hair",
    name: "Hair color",
    options: [
      ["Obsidian Black", "obsidian-black"], ["Cyber Blue", "cyber-blue"], ["Acid Purple", "acid-purple"], ["Platinum Silver", "platinum-silver"], ["Sunset Pink", "sunset-pink"]
    ]
  },
  {
    id: "lips",
    name: "Lip color",
    options: [
      ["Glossy Crimson", "glossy-crimson"], ["Electric Magenta", "electric-magenta"], ["Dark Velvet Plum", "dark-velvet-plum"], ["Neon Cyan", "neon-cyan"], ["Matte Nude", "matte-nude"]
    ]
  },
  {
    id: "apparel",
    name: "Apparel",
    options: [
      ["Flowy Sundress · Tropical Neon", "tropical-neon"], ["Cherry Blossom Noir", "cherry-blossom-noir"], ["Geometric Prism", "geometric-prism"], ["Statement Crop & Skirt", "statement-crop-skirt"], ["Neon Bodysuit with Mesh", "neon-mesh"]
    ]
  }
];

export default function TraitMixer() {
  const [selected, setSelected] = useState({ hair: null, lips: null, apparel: null });
  const activeOptions = categories.flatMap((category) => {
    const key = selected[category.id];
    return key ? [{ category, option: category.options.find(([, id]) => id === key) }] : [];
  });

  function choose(categoryId, optionId) {
    setSelected((current) => ({ ...current, [categoryId]: current[categoryId] === optionId ? null : optionId }));
  }

  function reset() {
    setSelected({ hair: null, lips: null, apparel: null });
  }

  return (
    <div className="admin-mixer">
      <section className="admin-mixer-preview" aria-label="Live Itty Bitty preview">
        <div className="admin-mixer-preview-head"><span>LIVE PREVIEW</span><span>{activeOptions.length ? `${activeOptions.length} LAYER${activeOptions.length === 1 ? "" : "S"} ON` : "BASE ONLY"}</span></div>
        <div className="admin-mixer-stage">
          <img className="admin-mixer-base" src="/admin-review/blank-base.webp" alt="Itty Bitty base pencil, with the original silhouette" />
          {activeOptions.map(({ category, option }) => (
            <img key={category.id} className="admin-mixer-overlay" src={`/admin-review/overlays/${category.id}-${option[1]}.webp`} alt={`${category.name}: ${option[0]}`} />
          ))}
        </div>
        <div className="admin-mixer-caption">
          <strong>Itty Bitty</strong>
          <span>{activeOptions.length ? activeOptions.map(({ option }) => option[0]).join(" · ") : "Original blank pencil"}</span>
        </div>
        <button className="admin-mixer-reset" type="button" onClick={reset} disabled={!activeOptions.length}>Reset to blank</button>
      </section>

      <section className="admin-mixer-controls" aria-label="Character trait controls">
        {categories.map((category, categoryIndex) => (
          <fieldset className="admin-mixer-group" key={category.id}>
            <legend><span>{String(categoryIndex + 1).padStart(2, "0")}</span>{category.name}<small>{selected[category.id] ? "1 SELECTED" : "OPTIONAL"}</small></legend>
            <div className="admin-mixer-options">
              {category.options.map(([label, key], index) => {
                const isSelected = selected[category.id] === key;
                return (
                  <button className={`admin-mixer-option${isSelected ? " selected" : ""}`} key={key} type="button" aria-pressed={isSelected} onClick={() => choose(category.id, key)} title={`${isSelected ? "Remove" : "Apply"} ${label}`}>
                    <span className="admin-mixer-option-art"><img src={`/admin-review/generated/${key}.webp`} alt="" loading="lazy" /></span>
                    <span className="admin-mixer-option-name"><small>{String(index + 1).padStart(2, "0")}</small>{label}</span>
                    <span className="admin-mixer-check" aria-hidden="true">{isSelected ? "✓" : "+"}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <div className="admin-mixer-controls-foot">
          <p>Select one option in each layer. Select it again to remove it. The pencil outline stays fixed.</p>
          <a className="admin-review-download" href="/admin-review/female-trait-layers.ora" download>Download editable layers <span>↗</span></a>
        </div>
      </section>
    </div>
  );
}

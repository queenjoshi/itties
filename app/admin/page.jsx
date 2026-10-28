import Link from "next/link";

export const metadata = {
  title: "Art Review · Itty Bitty",
  description: "Review the Itty Bitty base character and female trait concept layers."
};

const traits = [
  {
    id: "01",
    title: "Hair color",
    options: [
      ["Obsidian Black", "obsidian-black"], ["Cyber Blue", "cyber-blue"], ["Acid Purple", "acid-purple"], ["Platinum Silver", "platinum-silver"], ["Sunset Pink", "sunset-pink"]
    ]
  },
  {
    id: "02",
    title: "Lip color",
    options: [
      ["Glossy Crimson", "glossy-crimson"], ["Electric Magenta", "electric-magenta"], ["Dark Velvet Plum", "dark-velvet-plum"], ["Neon Cyan", "neon-cyan"], ["Matte Nude", "matte-nude"]
    ]
  },
  {
    id: "03",
    title: "Apparel",
    options: [
      ["Flowy Sundress · Tropical Neon", "tropical-neon"], ["Cherry Blossom Noir", "cherry-blossom-noir"], ["Geometric Prism", "geometric-prism"], ["Statement Crop & Skirt", "statement-crop-skirt"], ["Neon Bodysuit with Mesh", "neon-mesh"]
    ]
  }
];

export default function AdminArtReview() {
  return (
    <main className="admin-review">
      <header className="admin-review-nav">
        <Link href="/" className="admin-review-brand"><img src="/assets/itties-mark.svg" alt="" /> ITTY BITTY <span>ART ROOM</span></Link>
        <Link href="/" className="admin-review-back">← Back to the site</Link>
      </header>

      <div className="admin-review-wrap">
        <section className="admin-review-hero">
          <p className="admin-review-eyebrow"><i /> ADMIN · CHARACTER ART REVIEW</p>
          <h1>Blank to <em>character.</em></h1>
            <p>Review Itty Bitty’s unchanged pencil base beside the generated female archetype trait layers.</p>
        </section>

        <section className="admin-review-blank" aria-labelledby="admin-blank-title">
          <div className="admin-review-blank-art"><img src="/admin-review/blank-base.webp" alt="Current matte-black Itty pencil base concept" /></div>
          <div className="admin-review-blank-copy">
            <p className="admin-review-eyebrow">GENESIS · BASE CHARACTER</p>
            <h2 id="admin-blank-title">The blank</h2>
            <p>This is the Itty Bitty base character. Its pencil silhouette, body, face, and arms remain unchanged while trait details are prepared as separate layers.</p>
            <span className="admin-review-chip">ITTY BITTY · BASE LAYER</span>
          </div>
        </section>

        <section className="admin-review-traits" aria-labelledby="admin-traits-title">
          <div className="admin-review-section-head">
            <div><p className="admin-review-eyebrow">FEMALE ARCHETYPE · TRAIT BOARDS</p><h2 id="admin-traits-title">Trait <em>layers.</em></h2></div>
            <a className="admin-review-download" href="/admin-review/female-trait-layers.ora" download>Download layered artwork <span>↗</span></a>
          </div>
          <div className="admin-review-grid">
            {traits.map((trait) => (
              <article className="admin-review-card" key={trait.id}>
                <div className="admin-review-card-heading"><span>{trait.id}</span><h3>{trait.title}</h3><small>5 OPTIONS</small></div>
                <ol className="admin-review-options">{trait.options.map(([option, asset], index) => <li key={asset}><span>{String(index + 1).padStart(2, "0")}</span><img src={`/admin-review/generated/${asset}.webp`} alt="" /><b>{option}</b></li>)}</ol>
              </article>
            ))}
          </div>
        </section>

        <aside className="admin-review-note"><span>ART STATUS</span><p>Generated trait details are stored as independent transparent PNG layers; Itty Bitty’s base silhouette is unchanged. These are visual concept assets and are not wired to NFT metadata or minting.</p></aside>
        <footer className="admin-review-footer">THE HOUSE OF JOSHI <span>·</span> INTERNAL ART REVIEW</footer>
      </div>
    </main>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Art Review · Itty Bitty",
  description: "Review the Itty Bitty base character and female trait concept layers."
};

const traits = [
  {
    id: "01",
    title: "Hair color",
    image: "/admin-review/female-hair.webp",
    options: ["Obsidian Black", "Cyber Blue", "Acid Purple", "Platinum Silver", "Sunset Pink"]
  },
  {
    id: "02",
    title: "Lip color",
    image: "/admin-review/female-lips.webp",
    options: ["Glossy Crimson", "Electric Magenta", "Dark Velvet Plum", "Neon Cyan", "Matte Nude"]
  },
  {
    id: "03",
    title: "Apparel",
    image: "/admin-review/female-apparel.webp",
    options: ["Flowy Sundress · Tropical Neon", "Cherry Blossom Noir", "Geometric Prism", "Statement Crop & Skirt", "Neon Bodysuit with Mesh"]
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
          <p>Review the current pencil base and the female trait artwork together. This page is a visual workbench for checking the art.</p>
        </section>

        <section className="admin-review-blank" aria-labelledby="admin-blank-title">
          <div className="admin-review-blank-art"><img src="/admin-review/blank-base.webp" alt="Current matte-black Itty pencil base concept" /></div>
          <div className="admin-review-blank-copy">
            <p className="admin-review-eyebrow">GENESIS · BASE CHARACTER</p>
            <h2 id="admin-blank-title">The blank</h2>
            <p>Current base concept: matte-black pencil body, eraser, ferrule, face and arms. It is the starting character artwork before these female concept variations.</p>
            <span className="admin-review-chip">BASE ART · CONCEPT</span>
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
                <div className="admin-review-card-art"><img src={trait.image} alt={`${trait.title} concept sheet with five female Itty trait variants`} /></div>
                <ol className="admin-review-options">{trait.options.map((option, index) => <li key={option}><span>{String(index + 1).padStart(2, "0")}</span>{option}</li>)}</ol>
              </article>
            ))}
          </div>
        </section>

        <aside className="admin-review-note"><span>ART STATUS</span><p>These are concept boards, not production-ready transparent cutouts. The OpenRaster file contains each trait category as a separate toggleable layer. No controls here alter NFT metadata or minting.</p></aside>
        <footer className="admin-review-footer">THE HOUSE OF JOSHI <span>·</span> INTERNAL ART REVIEW</footer>
      </div>
    </main>
  );
}

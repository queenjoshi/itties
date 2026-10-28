import Link from "next/link";
import TraitMixer from "./trait-mixer";

export const metadata = {
  title: "Customize · Itty Bitty",
  description: "Mix female Itty Bitty traits and preview them on the original pencil."
};

export default function AdminArtReview() {
  return (
    <main className="admin-review">
      <header className="admin-review-nav">
        <Link href="/" className="admin-review-brand"><img src="/assets/itties-mark.svg" alt="" /> ITTY BITTY <span>CUSTOMIZER</span></Link>
        <Link href="/" className="admin-review-back">← Back to the site</Link>
      </header>

      <div className="admin-review-wrap">
        <section className="admin-review-hero">
          <p className="admin-review-eyebrow"><i /> ITTY BITTY · LIVE CUSTOMIZER</p>
          <h1>Make it <em>Itty Bitty.</em></h1>
          <p>Pick a few traits and see your combination on the original pencil. The base silhouette stays the same.</p>
        </section>

        <section className="admin-review-traits" aria-labelledby="admin-traits-title">
          <div className="admin-review-section-head">
            <div><p className="admin-review-eyebrow">FEMALE ARCHETYPE · LIVE TRAIT MIXER</p><h2 id="admin-traits-title">Build a <em>look.</em></h2></div>
          </div>
          <TraitMixer />
        </section>

        <aside className="admin-review-note"><span>ART STATUS</span><p>Trait selections are visual previews made from generated component layers. They stay clipped to Itty Bitty’s original shape; selections are not saved and do not change NFT metadata.</p></aside>
        <footer className="admin-review-footer">THE HOUSE OF JOSHI <span>·</span> ITTY BITTY CUSTOMIZER</footer>
      </div>
    </main>
  );
}

import Link from "next/link";

const rewards = {
  "lab-credit": {
    number: "01", eyebrow: "GENESIS CREDIT", title: "The Reissued Lab Credit.", lead: "One more blank. One more chance to make a mark.",
    copy: "After an Itty earns a permanent place in the Hall of Fame Vault, its holder receives one genesis credit. Redeem it for a fresh blank pencil, take it into the Lab, and begin the climb again.",
    stamp: "52 VERIFIED WINS · A NEW GENESIS", note: "The contract issues the credit when an Itty retires and lets the holder claim a new blank with claimHallOfFameGenesis()."
  },
  "creator-spotlight": {
    number: "02", eyebrow: "CREATOR SPOTLIGHT", title: "Your Itty enters the story world.", lead: "Your character gets guaranteed consideration for the House of Joshi media roadmap.",
    copy: "Seasonal features may include an animated holiday special, a digital short story, or a character arc in an upcoming children’s book. The House reviews inducted characters for each rotating feature.",
    stamp: "ANIMATED SHORTS · STORIES · BOOKS", note: "Media selection and release dates remain part of the House of Joshi seasonal production roadmap."
  },
  merchandise: {
    number: "03", eyebrow: "MERCHANDISE PROFIT-SHARING", title: "From the vault to the real world.", lead: "Bring your one-of-one Itty into an upcoming physical merchandise line.",
    copy: "Inducted characters are planned for direct inclusion in future products using their exact bound expansion traits, paired with co-branded profit-sharing mechanics for their holders.",
    stamp: "EXACT TRAITS · CO-BRANDED · SHARED", note: "Product selection, licensing, accounting, and profit-sharing rates must be defined before a line is offered."
  }
};

export default async function RewardPage({ params }) {
  const { slug } = await params;
  const reward = rewards[slug];
  if (!reward) return <main className="reward-page"><Link href="/#vault">← Return to the Hall of Fame</Link><h1>Reward not found</h1></main>;
  return <main className="reward-page">
    <header className="reward-nav"><Link href="/" className="launch-brand"><img src="/assets/itties-mark.svg" alt=""/><span>ITTY BITTY</span><small>THE ITTIES</small></Link><Link href="/#vault">← BACK TO THE HALL</Link></header>
    <div className="reward-wrap"><Link href="/#vault" className="reward-back">← HALL OF FAME REWARDS</Link><section className="reward-card"><div className={`reward-art reward-art-${reward.number}`} aria-hidden="true"><span>✳</span><b>{reward.number}</b></div><div className="reward-copy"><p className="eyebrow">LEGACY PACKAGE · {reward.number} / {reward.eyebrow}</p><h1>{reward.title}</h1><p className="reward-lead">{reward.lead}</p><p>{reward.copy}</p><div className="reward-stamp">{reward.stamp}</div><Link className="launch-primary" href="/#vault">RETURN TO THE VAULT ↗</Link></div></section><p className="reward-note">{reward.note}</p></div>
    <footer className="launch-footer"><Link className="launch-brand" href="/"><img src="/assets/itties-mark.svg" alt=""/><span>ITTY BITTY</span></Link><span>THE HOUSE OF JOSHI · EVERY LEGEND STARTS AS A BLANK</span></footer>
  </main>;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${rewards[slug]?.eyebrow || "Hall of Fame Reward"} · The Itties`, description: rewards[slug]?.lead || "Discover the Itties Hall of Fame legacy rewards." };
}

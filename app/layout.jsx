import "../styles.css";
import "../royal.css";
import "./app.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Itty Bitty · The Itties",
  description: "A high-fashion digital collectible world on Base. Mint, bind expansion packs, climb the 52-win gauntlet, and enter the Hall of Fame Vault."
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}

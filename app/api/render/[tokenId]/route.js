import { basePoseForToken } from "../../../_lib/base-poses";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createPublicClient, http, parseAbi, isAddress } from "viem";
import { base } from "viem/chains";

export const dynamic = "force-dynamic";

const coreAbi = parseAbi(["function ownerOf(uint256) view returns (address)", "function getAttachedExpansions(uint256) view returns (uint256[])"]);
const packAbi = parseAbi(["function packInfo(uint256) view returns (string name,string metadataURI,uint256 kingPrice,uint256 queenPrice,uint32 rarityWeight,uint64 supplyCap,uint64 minted,bool active,bool luxury)"]);
const escapeXml = text => String(text).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;" })[character]);

function ipfsUrl(uri) {
  if (!uri?.startsWith("ipfs://")) return null;
  const gateway = (process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.io/ipfs/").replace(/\/?$/, "/");
  return gateway + uri.slice(7).replace(/^ipfs\//, "");
}

async function fetchImageData(uri) {
  const url = ipfsUrl(uri);
  if (!url) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: "image/png,image/webp,image/jpeg" } });
    if (!response.ok || !/^image\/(png|webp|jpeg)$/.test(response.headers.get("content-type") || "")) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 4_000_000) return null;
    const type = response.headers.get("content-type");
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}

async function resolvePackImage(metadataUri) {
  const jsonUrl = ipfsUrl(metadataUri);
  if (!jsonUrl) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(jsonUrl, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) return null;
    const metadata = await response.json();
    return { image: await fetchImageData(metadata.image), name: metadata.name || "Expansion" };
  } catch { return null; }
  finally { clearTimeout(timeout); }
}

export async function GET(_request, { params }) {
  const { tokenId: rawId } = await params;
  if (!/^\d+$/.test(rawId) || BigInt(rawId) === 0n) return new Response("Invalid token ID", { status: 400 });
  const coreAddress = process.env.NEXT_PUBLIC_ITTIES_CORE_ADDRESS;
  const packsAddress = process.env.NEXT_PUBLIC_EXPANSION_PACKS_ADDRESS;
  if (!isAddress(coreAddress || "") || !isAddress(packsAddress || "")) return new Response("Renderer is not configured", { status: 503 });
  try {
    const client = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org") });
    const id = BigInt(rawId);
    const [holder, ids] = await Promise.all([
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "ownerOf", args: [id] }),
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "getAttachedExpansions", args: [id] })
    ]);
    const pose = basePoseForToken(id, coreAddress);
    const [baseBytes, packs] = await Promise.all([
      readFile(path.join(process.cwd(), "public/assets/base-poses", pose.file)),
      Promise.all(ids.map(async expansionId => {
        const info = await client.readContract({ address: packsAddress, abi: packAbi, functionName: "packInfo", args: [expansionId] });
        const layer = await resolvePackImage(info[1]);
        return layer ? { ...layer, rarity: Number(info[4]) } : null;
      }))
    ]);
    const layers = packs.filter(Boolean);
    const baseData = `data:image/webp;base64,${baseBytes.toString("base64")}`;
    const layerMarkup = layers.map((layer, index) => `<image href="${layer.image}" x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid meet" opacity=".98"/><text x="44" y="${916 - index * 32}" fill="#f4eeff" font-family="sans-serif" font-size="18">${escapeXml(layer.name)} · RARITY +${layer.rarity}</text>`).join("");
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="1000" viewBox="0 0 1000 1000"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#241035"/><stop offset=".5" stop-color="#301753"/><stop offset="1" stop-color="#111020"/></linearGradient><radialGradient id="glow"><stop stop-color="#b947ed" stop-opacity=".8"/><stop offset="1" stop-color="#b947ed" stop-opacity="0"/></radialGradient></defs><rect width="1000" height="1000" fill="url(#bg)"/><circle cx="500" cy="450" r="460" fill="url(#glow)"/><image href="${baseData}" x="0" y="0" width="1000" height="1000" preserveAspectRatio="xMidYMid meet"/>${layerMarkup}<rect x="18" y="18" width="964" height="964" rx="26" fill="none" stroke="#eaff3d" stroke-opacity=".7" stroke-width="3"/><text x="44" y="64" fill="#eaff3d" font-family="sans-serif" font-size="20" letter-spacing="5">THE ITTIES · HOUSE OF JOSHI</text><text x="44" y="956" fill="#ffffff" font-family="sans-serif" font-size="24">ITTY #${rawId} · ${layers.length} BOUND EXPANSION${layers.length === 1 ? "" : "S"}</text></svg>`;
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300", "X-Itty-Owner": holder.toLowerCase() } });
  } catch {
    return new Response("Token image could not be composed from Base expansion data", { status: 404 });
  }
}

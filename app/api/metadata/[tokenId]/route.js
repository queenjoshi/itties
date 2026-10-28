import { createPublicClient, http, parseAbi, isAddress } from "viem";
import { base } from "viem/chains";

export const dynamic = "force-dynamic";

const coreAbi = parseAbi([
  "function ownerOf(uint256) view returns (address)",
  "function getWinCount(uint256) view returns (uint8)",
  "function isRetired(uint256) view returns (bool)",
  "function getAttachedExpansions(uint256) view returns (uint256[])",
  "function rarityScore(uint256) view returns (uint256)",
  "function ittyProgress(uint256) view returns (uint8 winCount,bool isRetired,bool isHallOfFame,uint64 labRevision)"
]);
const packAbi = parseAbi([
  "function packInfo(uint256) view returns (string name,string metadataURI,uint256 kingPrice,uint256 queenPrice,uint32 rarityWeight,uint64 supplyCap,uint64 minted,bool active,bool luxury)"
]);

export async function GET(request, { params }) {
  const { tokenId: routeId } = await params;
  const rawId = routeId.replace(/\.json$/, "");
  if (!/^\d+$/.test(rawId) || BigInt(rawId) === 0n) return Response.json({ error: "Invalid token ID" }, { status: 400 });
  const coreAddress = process.env.NEXT_PUBLIC_ITTIES_CORE_ADDRESS;
  const packsAddress = process.env.NEXT_PUBLIC_EXPANSION_PACKS_ADDRESS;
  if (!isAddress(coreAddress || "") || !isAddress(packsAddress || "")) return Response.json({ error: "Collection metadata is not configured" }, { status: 503 });
  try {
    const client = createPublicClient({ chain: base, transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://mainnet.base.org") });
    const id = BigInt(rawId);
    const [holder, winCount, isRetired, expansionIds, rarityScore, progress] = await Promise.all([
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "ownerOf", args: [id] }),
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "getWinCount", args: [id] }),
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "isRetired", args: [id] }),
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "getAttachedExpansions", args: [id] }),
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "rarityScore", args: [id] }),
      client.readContract({ address: coreAddress, abi: coreAbi, functionName: "ittyProgress", args: [id] })
    ]);
    const packs = await Promise.all(expansionIds.map(expansionId => client.readContract({ address: packsAddress, abi: packAbi, functionName: "packInfo", args: [expansionId] })));
    const origin = new URL(request.url).origin;
    const renderer = process.env.NEXT_PUBLIC_METADATA_RENDERER_URL?.replace(/\/$/, "");
    const attributes = [
      { trait_type: "Win Count", value: Number(winCount) },
      { trait_type: "Hall of Fame", value: isRetired },
      { trait_type: "Rarity Score", value: Number(rarityScore) },
      { trait_type: "Bound Expansions", value: expansionIds.length },
      { trait_type: "Lab Revision", value: Number(progress.labRevision) },
      { trait_type: "Current Owner", value: holder.toLowerCase() }
    ];
    packs.forEach((pack, index) => {
      attributes.push({ trait_type: "Expansion", value: pack[0] });
      attributes.push({ trait_type: `${pack[0]} Rarity Weight`, value: Number(pack[4]) });
      attributes.push({ trait_type: `${pack[0]} Pack ID`, value: Number(expansionIds[index]) });
    });
    return Response.json({
      name: `Itty #${rawId}`,
      description: "A House of Joshi digital collectible on Base. Its identity is composed from expansion packs permanently bound to its on-chain DNA.",
      image: renderer ? `${renderer}/${rawId}` : `${origin}/api/render/${rawId}`,
      external_url: `${origin}/#inventory`,
      attributes
    }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=300" } });
  } catch {
    return Response.json({ error: "Token metadata could not be read from Base" }, { status: 404 });
  }
}

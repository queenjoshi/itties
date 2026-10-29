import { keccak256, toHex } from "viem";

export const BASE_POSES = [
  { id: "tilt-left", name: "Tilt Left", file: "tilt-left.webp" },
  { id: "tilt-right", name: "Tilt Right", file: "tilt-right.webp" },
  { id: "straight", name: "Straight", file: "straight.webp" }
];

// Stable equal-weight pseudorandom assignment, shared by metadata and renderer.
// This is predictable from token ID; it is not a verifiable random mint draw.
export function basePoseForToken(tokenId, contractAddress) {
  const seed = `${contractAddress.toLowerCase()}:${BigInt(tokenId)}:itty-base-pose-v1`;
  return BASE_POSES[Number(BigInt(keccak256(toHex(seed))) % 3n)];
}

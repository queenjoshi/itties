export const STANDARD_SKINS = [
  { id: "blue", name: "Blue" },
  { id: "red", name: "Red" },
  { id: "purple", name: "Purple" },
  { id: "yellow", name: "Yellow" },
  { id: "orange", name: "Orange" },
  { id: "green", name: "Green" },
  { id: "black", name: "Black" },
  { id: "white", name: "White" }
];
export const NEON_SKINS = [
  { id: "neon-blue", name: "Neon Blue" },
  { id: "neon-red", name: "Neon Red" },
  { id: "neon-purple", name: "Neon Purple" },
  { id: "neon-yellow", name: "Neon Yellow" },
  { id: "neon-orange", name: "Neon Orange" },
  { id: "neon-green", name: "Neon Green" }
];
export const PENCIL_COLOURS = [...STANDARD_SKINS, ...NEON_SKINS];
export const LUXURY_SKINS = [
  { id: "silver", name: "Silver", reservedFor: "luxury-pack" },
  { id: "golden", name: "Golden", reservedFor: "luxury-pack" }
];

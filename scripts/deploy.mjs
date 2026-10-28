import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { createPublicClient, createWalletClient, http, isAddress, parseAbi, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const networkFlag = process.argv.indexOf("--network");
const networkName = networkFlag >= 0 ? process.argv[networkFlag + 1] : "baseSepolia";
if (!['baseSepolia', 'base'].includes(networkName)) throw new Error("Use --network baseSepolia or --network base.");
const chain = networkName === "base"
  ? defineChain({ id: 8453, name: "Base", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org"] } }, blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } } })
  : defineChain({ id: 84532, name: "Base Sepolia", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, rpcUrls: { default: { http: [process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"] } }, blockExplorers: { default: { name: "Base Sepolia Explorer", url: "https://sepolia.basescan.org" } } });

const env = {
  privateKey: process.env.DEPLOYER_PRIVATE_KEY,
  king: process.env.DEPLOY_KING_TOKEN_ADDRESS,
  queen: process.env.DEPLOY_QUEEN_TOKEN_ADDRESS,
  treasury: process.env.DEPLOY_TREASURY_ADDRESS,
  royalty: process.env.DEPLOY_ROYALTY_RECEIVER,
  metadata: process.env.DEPLOY_METADATA_BASE_URI
};
if (!env.privateKey || !env.privateKey.startsWith("0x")) throw new Error("Set DEPLOYER_PRIVATE_KEY in your ignored .env.local file.");
for (const key of ["king", "queen", "treasury", "royalty"]) if (!isAddress(env[key] || "")) throw new Error(`Set a valid deployment address for ${key}.`);
if (!env.metadata || !env.metadata.endsWith("/")) throw new Error("DEPLOY_METADATA_BASE_URI must be a metadata-service base ending in '/'.");

execFileSync(process.execPath, [path.join(process.cwd(), "scripts/compile-contracts.mjs")], { stdio: "inherit" });
const artifact = name => JSON.parse(fs.readFileSync(path.join(process.cwd(), "artifacts/itties-core", `${name}.json`), "utf8"));
const account = privateKeyToAccount(env.privateKey);
const rpc = networkName === "base" ? process.env.BASE_MAINNET_RPC_URL || "https://mainnet.base.org" : process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org";
const transport = http(rpc);
const publicClient = createPublicClient({ chain, transport });
const walletClient = createWalletClient({ account, chain, transport });

async function deploy(name, args) {
  const built = artifact(name);
  const hash = await walletClient.deployContract({ abi: built.abi, bytecode: built.bytecode, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error(`${name} deployment failed: ${hash}`);
  console.log(`${name}: ${receipt.contractAddress} · ${hash}`);
  return receipt.contractAddress;
}

const coreAddress = await deploy("IttiesCore", [env.king, env.queen, env.royalty, env.treasury, env.metadata]);
const packsAddress = await deploy("IttiesExpansionPacks", [env.king, env.queen, env.treasury, env.royalty]);
const tournamentsAddress = await deploy("IttiesFlashTournaments", [coreAddress]);
const core = artifact("IttiesCore");
const tournamentAbi = parseAbi(["function setOperator(address,bool)"]);

async function send(address, abi, functionName, args) {
  const hash = await walletClient.writeContract({ address, abi, functionName, args });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log(`${functionName}: ${hash}`);
}

await send(packsAddress, artifact("IttiesExpansionPacks").abi, "setIttiesCore", [coreAddress]);
await send(coreAddress, core.abi, "setExpansionPacks", [packsAddress]);
await send(coreAddress, core.abi, "setOperator", [tournamentsAddress, true]);
await send(tournamentsAddress, tournamentAbi, "setOperator", [account.address, true]);

const envFile = path.join(process.cwd(), ".env.local");
const existing = fs.existsSync(envFile) ? fs.readFileSync(envFile, "utf8") : "";
const publicValues = {
  NEXT_PUBLIC_ITTIES_CORE_ADDRESS: coreAddress,
  NEXT_PUBLIC_EXPANSION_PACKS_ADDRESS: packsAddress,
  NEXT_PUBLIC_TOURNAMENT_ADDRESS: tournamentsAddress,
  NEXT_PUBLIC_KING_TOKEN_ADDRESS: env.king,
  NEXT_PUBLIC_QUEEN_TOKEN_ADDRESS: env.queen,
  NEXT_PUBLIC_START_BLOCK: String(await publicClient.getBlockNumber())
};
const replaced = new Set();
const lines = existing.split(/\r?\n/).filter(line => {
  const key = line.split("=", 1)[0];
  if (Object.hasOwn(publicValues, key)) { replaced.add(key); return false; }
  return true;
}).filter(Boolean);
for (const [key, value] of Object.entries(publicValues)) lines.push(`${key}=${value}`);
fs.writeFileSync(envFile, `${lines.join("\n")}\n`, { mode: 0o600 });
console.log(`Wrote deployed addresses to .env.local for ${chain.name}. Restart the Next.js server to load them.`);

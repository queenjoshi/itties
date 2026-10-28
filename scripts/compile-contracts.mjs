import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = process.cwd();
const names = ["IttiesCore.sol", "IttiesExpansionPacks.sol", "IttiesFlashTournaments.sol"];
const sources = Object.fromEntries(names.map(name => [name, { content: fs.readFileSync(path.join(root, "contracts", name), "utf8") }]));
const input = {
  language: "Solidity",
  sources,
  settings: {
    optimizer: { enabled: true, runs: 500 },
    evmVersion: "cancun",
    outputSelection: { "*": { "*": ["abi", "evm.bytecode.object", "evm.deployedBytecode.object"] } }
  }
};

function findImport(importPath) {
  const resolved = path.join(root, "node_modules", importPath);
  try { return { contents: fs.readFileSync(resolved, "utf8") }; }
  catch { return { error: `Import not found: ${importPath}` }; }
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImport }));
const errors = (output.errors || []).filter(message => message.severity === "error");
for (const message of output.errors || []) console.error(message.formattedMessage);
if (errors.length) process.exit(1);

const outDir = path.join(root, "artifacts", "itties-core");
fs.mkdirSync(outDir, { recursive: true });
for (const file of names) {
  const contracts = output.contracts?.[file] || {};
  for (const [name, artifact] of Object.entries(contracts)) {
    if (!artifact.evm?.bytecode?.object) continue;
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify({
      contractName: name,
      sourceName: file,
      abi: artifact.abi,
      bytecode: `0x${artifact.evm.bytecode.object}`,
      deployedBytecode: `0x${artifact.evm.deployedBytecode.object}`
    }, null, 2));
    console.log(`Compiled ${name}`);
  }
}

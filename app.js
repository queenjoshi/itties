import { ethers } from 'https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js';

const config = window.ITTY_CONFIG;
const ABI = [
  'function MINT_PRICE() view returns (uint256)',
  'function RESTYLE_FEE() view returns (uint256)',
  'function maxSupply() view returns (uint256)',
  'function maxPerWallet() view returns (uint256)',
  'function totalSupply() view returns (uint256)',
  'function owner() view returns (address)',
  'function mintItty() payable',
  'function ownerOf(uint256) view returns (address)',
  'function ittyConfigurations(uint256) view returns (uint8 bodyColor,uint8 eraserColor,uint8 eyes,uint8 mouth,uint8 expression,uint8 accessory,uint8 motionEffect,bool isInitialized,bool isRetired,uint8 winsCount)',
  'function tokenWardrobe(uint256,uint8,uint8) view returns (bool)',
  'function initializeItty(uint256,uint8,uint8,uint8,uint8,uint8,uint8,uint8)',
  'function restyleItty(uint256,uint8,uint8,uint8,uint8,uint8,uint8,uint8) payable',
  'function recordWin(uint256)',
  'function retiredTokenIds() view returns (uint256[])',
  'event IttyMinted(address indexed owner,uint256 indexed tokenId)'
];

const layers = [
  { label: 'Body finish', image: '01-body-finishes.webp', options: ['Classic Red', 'Polka-Dot Pink', 'Sky Blue Striped', 'Floral', 'Stealth Matte Black', 'Neon Acid'] },
  { label: 'Eraser band', image: '02-eraser-bands.webp', options: ['Standard Pink', 'Blackout', 'Crimson Red', 'Electric Blue', 'Gold Metal Band', 'Neon Purple'] },
  { label: 'Eyes', image: '03-eyes.webp', options: ['Confident', 'Wide-Eyed', 'Designer Shades', 'Wild Stare', 'Cyber Visor', 'Wink'] },
  { label: 'Mouth', image: '04-mouths.webp', options: ['Grin', 'Smirk', 'Feral Snarl', 'Bubble Gum', 'Gold Grill', 'Neutral'] },
  { label: 'Expression', image: '05-expressions.webp', options: ['Chill', 'Hype', 'Fierce', 'Glitch', 'Focused', 'Relaxed'] },
  { label: 'Accessories', image: '06-accessories.webp', options: ['None', 'Puffer Coat', 'Bomber Jacket', 'Denim Vest', 'Gold Joshi Medallion', 'Dollar Chain'] },
  { label: 'Motion effects', image: '07-motion-effects.webp', options: ['Static', 'Neon Glow Pulse', 'Particle Dust', 'Glitch Overlay', 'Floating Bob', 'Gold Shimmer'] }
];

// Trait order matches the seven on-chain uint8 categories. These presets are
// editable starting looks; choosing one never submits a transaction by itself.
const signatureLooks = {
  sky:   { name: 'Sky',   traits: [2, 4, 1, 0, 1, 0, 5] },
  bloom: { name: 'Bloom', traits: [3, 4, 1, 0, 0, 0, 0] },
  noir:  { name: 'Noir',  traits: [4, 4, 2, 0, 4, 0, 5] }
};

const fashionTraitCategories = [
  { key: 'background', label: 'Background', options: [
    { id: 'bg_01', name: 'Neo-Tokyo Rain Alley', type: 'environment' },
    { id: 'bg_02', name: 'House of Joshi Blueprint Grid', type: 'environment' },
    { id: 'bg_03', name: 'Cyberpunk Runway', type: 'environment' },
    { id: 'bg_04', name: 'The Vault / Lab Core', type: 'environment' },
    { id: 'bg_05', name: 'Sunset Vaporwave Horizon', type: 'environment' }
  ] },
  { key: 'hairColor', label: 'Hair color', options: [
    { id: 'hair_01', name: 'Obsidian Black' }, { id: 'hair_02', name: 'Cyber Blue' },
    { id: 'hair_03', name: 'Acid Purple' }, { id: 'hair_04', name: 'Platinum Silver' },
    { id: 'hair_05', name: 'Sunset Pink' }
  ] },
  { key: 'lipColor', label: 'Lip color', options: [
    { id: 'lip_01', name: 'Glossy Crimson' }, { id: 'lip_02', name: 'Electric Magenta' },
    { id: 'lip_03', name: 'Dark Velvet Plum' }, { id: 'lip_04', name: 'Neon Cyan' },
    { id: 'lip_05', name: 'Matte Nude' }
  ] },
  { key: 'apparelFemale', label: 'Apparel · female archetype', options: [
    { id: 'app_f_01', name: 'Flowy Sundress (Tropical Neon)' }, { id: 'app_f_02', name: 'Cherry Blossom Noir' },
    { id: 'app_f_03', name: 'Geometric Prism' }, { id: 'app_f_04', name: 'Statement Crop & Skirt' },
    { id: 'app_f_05', name: 'Neon Bodysuit w/ Mesh' }
  ] }
];
const fashionTraitSelections = Object.fromEntries(fashionTraitCategories.map(category => [category.key, 0]));

function renderFashionWorkbench() {
  const grid = document.querySelector('#fashionTraitGrid');
  if (!grid) return;
  grid.replaceChildren(...fashionTraitCategories.map(category => {
    const field = document.createElement('fieldset');
    field.className = 'fashion-trait-category';
    const legend = document.createElement('legend'); legend.textContent = category.label;
    const select = document.createElement('select'); select.dataset.category = category.key;
    select.setAttribute('aria-label', category.label);
    category.options.forEach((option, index) => {
      const item = document.createElement('option'); item.value = String(index); item.textContent = `${option.name} · ${option.id}`; select.append(item);
    });
    select.addEventListener('change', () => {
      fashionTraitSelections[category.key] = Number(select.value);
      updateFashionSummary();
    });
    field.append(legend, select);
    const id = document.createElement('small'); id.className = 'fashion-trait-id'; id.textContent = `TRAIT KEY · ${category.key}`;
    field.append(id);
    return field;
  }));
  updateFashionSummary();
}

function updateFashionSummary() {
  const summary = document.querySelector('#fashionSummary');
  if (!summary) return;
  summary.textContent = fashionTraitCategories.map(category => category.options[fashionTraitSelections[category.key]].name).join(' · ');
}

// Character concepts based on the supplied ecosystem directive. Mint-time
// birth data remains blank until a token ID and block timestamp exist.
const dossiers = [
  { name: 'Amy', occupation: 'Smart Contract Architect', location: 'Base · House of Joshi node', origin: 'House of Joshi Genesis Vault #00', archetype: 'High-Fashion', palette: 'Cyber Blue · Platinum Silver', image: 'assets/itty-sky.webp', traits: ['Flowy Sundress · Tropical Neon', 'Designer Sunglasses', 'Cyber Blue hair · Glossy Crimson lips'] },
  { name: 'Roxy', occupation: 'Syndicate Runner', location: 'Neo-Tokyo · Rain Alley', origin: 'House of Joshi Genesis Vault #00', archetype: 'High-Fashion', palette: 'Sunset Pink · Acid Purple', image: 'assets/itty-bloom.webp', traits: ['Cherry Blossom Noir', 'Semi-Hot Branded Bag', 'Sunset Pink hair · Electric Magenta lips'] },
  { name: 'Vex', occupation: 'Runway Disruptor', location: 'The Vault · Lab Core', origin: 'House of Joshi Genesis Vault #00', archetype: 'High-Fashion', palette: 'Obsidian Black · Neon Cyan', image: 'assets/itty-noir.webp', traits: ['Geometric Prism', 'Mirrored Designer Sunglasses', 'Obsidian Black hair · Neon Cyan lips'] }
];

function renderDossiers() {
  const grid = document.querySelector('#dossierGrid');
  if (!grid) return;
  grid.replaceChildren(...dossiers.map((dossier, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'dossier-card';
    card.setAttribute('aria-label', `${dossier.name} Itty dossier. Flip to see details.`);
    card.setAttribute('aria-pressed', 'false');
    const inner = document.createElement('span');
    inner.className = 'dossier-inner';
    const front = document.createElement('span');
    front.className = 'dossier-face dossier-front';
    front.innerHTML = `<span class="dossier-number">HOUSE FILE · 00${index + 1}</span><img src="${dossier.image}" alt=""><strong>${dossier.name} Itty</strong><small>${dossier.archetype} · CHARACTER STUDY</small><span class="dossier-flip-hint">TAP TO FLIP ↻</span>`;
    const back = document.createElement('span');
    back.className = 'dossier-face dossier-back';
    const heading = document.createElement('strong'); heading.textContent = `${dossier.name} Itty`;
    const fields = [
      ['Official name', `${dossier.name} Itty`], ['Place of birth', dossier.origin],
      ['Birthdate', 'Set at mint · exact Base block timestamp'], ['Current location', dossier.location],
      ['Occupation', dossier.occupation], ['Style notes', `${dossier.palette} · ${dossier.traits.join(' · ')}`]
    ];
    const list = document.createElement('dl');
    fields.forEach(([label, value]) => { const row = document.createElement('div'); const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value; row.append(dt, dd); list.append(row); });
    const hint = document.createElement('small'); hint.textContent = 'TAP TO RETURN TO PORTRAIT ↻';
    back.append(heading, list, hint); inner.append(front, back); card.append(inner);
    card.addEventListener('click', () => { const flipped = card.getAttribute('aria-pressed') !== 'true'; card.setAttribute('aria-pressed', String(flipped)); });
    return card;
  }));
}

let provider;
let signer;
let contract;
let account = '';
let isCollectionOperator = false;
let currentTokenId = null;
let currentToken;
let activeCategory = 0;
let selectedTraits = Array(layers.length).fill(0);

const ui = {
  wallet: document.querySelector('#connectWallet'),
  chainStatus: document.querySelector('#chainStatus'),
  mint: document.querySelector('#mintItty'),
  mintPrice: document.querySelector('#mintPrice'),
  mintFeedback: document.querySelector('#mintFeedback'),
  unlockForm: document.querySelector('#unlockForm'),
  tokenId: document.querySelector('#tokenIdInput'),
  unlock: document.querySelector('#unlockItty'),
  labFeedback: document.querySelector('#labFeedback'),
  labContent: document.querySelector('#labContent'),
  tabs: document.querySelector('#traitTabs'),
  image: document.querySelector('#traitSheetImage'),
  options: document.querySelector('#traitOptions'),
  category: document.querySelector('#traitCategoryLabel'),
  selected: document.querySelector('#traitSelectedName'),
  count: document.querySelector('#traitCount'),
  tokenLabel: document.querySelector('#activeTokenLabel'),
  tokenState: document.querySelector('#tokenStateLabel'),
  summary: document.querySelector('#vaultSummary'),
  fee: document.querySelector('#saveFeeNote'),
  save: document.querySelector('#saveLook'),
  saveFeedback: document.querySelector('#saveFeedback'),
  wardrobe: document.querySelector('#wardrobeTraits'),
  winCount: document.querySelector('#winCount'),
  recordWin: document.querySelector('#recordWin'),
  winNote: document.querySelector('#winNote'),
  hallCount: document.querySelector('#hallCount'),
  hall: document.querySelector('#hallEntries'),
  signatures: document.querySelector('#signatureLooks')
};

const contractReady = Number.isInteger(config?.chainId)
  && ethers.isAddress(config?.contractAddress || '')
  && config.contractAddress !== ethers.ZeroAddress;

function messageFrom(error) {
  if (error?.code === 4001) return 'Transaction cancelled in wallet.';
  return error?.shortMessage || error?.reason || error?.message || 'The request failed. Check the network and try again.';
}

function setWalletLabel() {
  ui.wallet.textContent = account ? `${account.slice(0, 6)}…${account.slice(-4)} ↗` : 'CONNECT WALLET ↗';
}

function renderCategory() {
  const layer = layers[activeCategory];
  ui.image.src = `artwork-traits/${layer.image}`;
  ui.image.alt = `Six ${layer.label.toLowerCase()} options for Itties pencils`;
  ui.category.textContent = layer.label.toUpperCase();
  ui.options.setAttribute('aria-label', `Choose ${layer.label.toLowerCase()}`);
  ui.tabs.replaceChildren(...layers.map((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(index === activeCategory));
    button.textContent = item.label;
    button.addEventListener('click', () => {
      activeCategory = index;
      renderCategory();
    });
    return button;
  }));
  ui.selected.textContent = layer.options[selectedTraits[activeCategory]];
  ui.count.textContent = `${String(selectedTraits[activeCategory] + 1).padStart(2, '0')} / 06`;
  ui.options.replaceChildren(...layer.options.map((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'trait-hotspot';
    button.setAttribute('aria-label', option);
    button.setAttribute('aria-pressed', String(index === selectedTraits[activeCategory]));
    button.addEventListener('click', () => {
      selectedTraits[activeCategory] = index;
      renderCategory();
    });
    return button;
  }));
  renderSignatureSelection();
}

function renderSignatureSelection() {
  if (!ui.signatures) return;
  const selected = Object.entries(signatureLooks).find(([, look]) =>
    look.traits.every((trait, index) => selectedTraits[index] === trait)
  )?.[0];
  ui.signatures.querySelectorAll('[data-look]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.look === selected));
  });
}

ui.signatures?.addEventListener('click', event => {
  const button = event.target.closest('[data-look]');
  if (!button) return;
  const look = signatureLooks[button.dataset.look];
  if (!look) return;
  selectedTraits = [...look.traits];
  activeCategory = 0;
  renderCategory();
  if (currentToken) {
    ui.saveFeedback.textContent = `${look.name} look selected. Adjust any layer, then save it to your on-chain wardrobe.`;
    ui.save.disabled = currentToken.retired;
  }
});

document.querySelector('#copyFashionLook')?.addEventListener('click', async () => {
  const feedback = document.querySelector('#fashionFeedback');
  try {
    await navigator.clipboard.writeText(fashionTraitCategories.map(category => {
      const option = category.options[fashionTraitSelections[category.key]];
      return `${category.label}: ${option.name} (${option.id})`;
    }).join('\n'));
    feedback.textContent = 'Fashion concept copied.';
  } catch {
    feedback.textContent = 'Clipboard access is unavailable in this browser.';
  }
});

function renderWardrobe(wardrobe) {
  ui.wardrobe.replaceChildren();
  const heading = document.createElement('small');
  heading.textContent = 'UNLOCKED TRAITS · SELECT ONE TO RESTYLE';
  ui.wardrobe.append(heading);
  wardrobe.forEach((options, categoryIndex) => {
    const row = document.createElement('div');
    row.className = 'wardrobe-row';
    const category = document.createElement('span');
    category.textContent = layers[categoryIndex].label;
    row.append(category);
    options.forEach((owned, optionIndex) => {
      if (!owned) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = layers[categoryIndex].options[optionIndex];
      button.setAttribute('aria-pressed', String(selectedTraits[categoryIndex] === optionIndex));
      button.addEventListener('click', () => {
        selectedTraits[categoryIndex] = optionIndex;
        activeCategory = categoryIndex;
        renderCategory();
      });
      row.append(button);
    });
    ui.wardrobe.append(row);
  });
}

async function loadToken(tokenId) {
  const owner = await contract.ownerOf(tokenId);
  if (owner.toLowerCase() !== account.toLowerCase()) {
    throw new Error(`Wallet ${account.slice(0, 6)}…${account.slice(-4)} does not own Itty #${tokenId}.`);
  }
  const traits = await contract.ittyConfigurations(tokenId);
  const wardrobe = await Promise.all(layers.map((_, category) => Promise.all(
    layers[category].options.map((__, option) => contract.tokenWardrobe(tokenId, category, option))
  )));
  currentTokenId = tokenId;
  currentToken = {
    initialized: traits.isInitialized,
    retired: traits.isRetired,
    wins: Number(traits.winsCount),
    traits: traits.slice(0, 7).map(Number),
    wardrobe
  };
  selectedTraits = currentToken.initialized
    ? [...currentToken.traits]
    : [...signatureLooks.sky.traits];
  ui.tokenLabel.textContent = `WORKBENCH OPEN · #${tokenId}`;
  ui.tokenState.textContent = currentToken.retired ? 'RETIRED · HALL OF FAME' : currentToken.initialized ? 'WARDROBE VAULT · OPEN' : 'FIRST BUILD · FREE';
  ui.summary.textContent = currentToken.initialized
    ? currentToken.traits.map((option, index) => `${layers[index].label}: ${layers[index].options[option]}`).join(' · ')
    : 'No look saved yet';
  ui.fee.textContent = currentToken.initialized
    ? `Restyle: ${ethers.formatEther(await contract.RESTYLE_FEE())} ETH plus network gas. Your wallet will ask you to approve the transaction.`
    : 'The first configuration is free; network gas still applies.';
  ui.winCount.textContent = `${currentToken.wins} / 10 WINS${currentToken.retired ? ' · RETIRED' : ''}`;
  ui.save.disabled = currentToken.retired;
  ui.save.innerHTML = currentToken.initialized ? 'Save look & update vault <span>↗</span>' : 'Lock in initial build <span>↗</span>';
  ui.recordWin.hidden = !isCollectionOperator;
  ui.recordWin.disabled = currentToken.retired;
  ui.labContent.hidden = false;
  ui.saveFeedback.textContent = '';
  renderCategory();
  renderWardrobe(wardrobe);
}

async function loadHall() {
  const ids = await contract.retiredTokenIds();
  ui.hallCount.textContent = `HALL OF FAME · ${String(ids.length).padStart(3, '0')}`;
  ui.hall.replaceChildren();
  if (ids.length === 0) {
    const icon = document.createElement('span');
    icon.textContent = '✳';
    const title = document.createElement('strong');
    title.innerHTML = 'The first legend<br>has yet to be written.';
    const note = document.createElement('small');
    note.textContent = 'EVERY CHAMPION STARTS AS A BLANK';
    ui.hall.append(icon, title, note);
    return;
  }
  for (const id of ids) {
    const entry = document.createElement('article');
    entry.className = 'hall-entry';
    const name = document.createElement('strong');
    name.textContent = `ITTY #${id} · HALL OF FAME`;
    const owner = document.createElement('small');
    owner.textContent = `CURRENT OWNER · ${(await contract.ownerOf(id)).slice(0, 8)}…`;
    entry.append(name, owner);
    ui.hall.append(entry);
  }
}

async function connectWallet() {
  if (!window.ethereum) throw new Error('No injected wallet was found. Open this site in a browser with MetaMask or another EVM wallet.');
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  signer = await provider.getSigner();
  account = await signer.getAddress();
  const network = await provider.getNetwork();
  setWalletLabel();
  ui.unlock.disabled = false;
  if (!contractReady) {
    if (Number(network.chainId) !== config.chainId) {
      ui.chainStatus.innerHTML = `<span></span> WALLET CONNECTED · SWITCH TO ${config.chainName.toUpperCase()} (CHAIN ${config.chainId})`;
      ui.mintFeedback.textContent = `Base is the selected network. Switch to Base before using the Itty Lab.`;
      ui.labFeedback.textContent = `Base is the selected network. Switch to Base before loading your Itties.`;
      return;
    }
    ui.chainStatus.innerHTML = `<span></span> WALLET CONNECTED · ${config.chainName.toUpperCase()} · CONTRACT DEPLOYMENT REQUIRED`;
    ui.mintFeedback.textContent = 'Wallet connected. Minting unlocks after the collection contract is deployed and configured.';
    ui.labFeedback.textContent = 'Wallet connected. Configure the deployed collection contract to load your Itties.';
    await loadHall().catch(() => {});
    return;
  }
  if (Number(network.chainId) !== config.chainId) {
    const expected = config.chainName || `chain ${config.chainId}`;
    ui.chainStatus.innerHTML = `<span></span> CONNECTED TO CHAIN ${network.chainId} · SWITCH TO ${expected.toUpperCase()}`;
    ui.mintFeedback.textContent = 'Switch your wallet to the collection network before minting.';
    return;
  }
  contract = new ethers.Contract(config.contractAddress, ABI, signer);
  const [mintPrice, total, max, owner] = await Promise.all([
    contract.MINT_PRICE(), contract.totalSupply(), contract.maxSupply(), contract.owner()
  ]);
  ui.mintPrice.textContent = `${ethers.formatEther(mintPrice)} ETH`;
  ui.chainStatus.innerHTML = `<span></span> WALLET CONNECTED · ${config.chainName.toUpperCase()} · ${total} / ${max} MINTED`;
  ui.mint.disabled = BigInt(total) >= BigInt(max);
  ui.mintFeedback.textContent = ui.mint.disabled ? 'This collection has reached its supply limit.' : 'Minting is a real on-chain transaction. Your wallet will show the full cost and network gas before you approve.';
  isCollectionOperator = account.toLowerCase() === owner.toLowerCase();
  ui.winNote.textContent = isCollectionOperator
    ? 'YOU ARE THE COLLECTION OPERATOR · WIN RECORDING SENDS AN ON-CHAIN TRANSACTION'
    : 'WINS ARE RECORDED BY THE COLLECTION OPERATOR';
  ui.recordWin.hidden = !isCollectionOperator;
  await loadHall();
}

ui.wallet.addEventListener('click', async () => {
  try {
    await connectWallet();
  } catch (error) {
    ui.chainStatus.innerHTML = `<span></span> ${messageFrom(error).toUpperCase()}`;
  }
});

ui.mint.addEventListener('click', async () => {
  if (!contract || !signer) return;
  ui.mint.disabled = true;
  ui.mintFeedback.textContent = 'Confirm the mint and network gas in your wallet.';
  try {
    const tx = await contract.mintItty({ value: await contract.MINT_PRICE() });
    ui.mintFeedback.textContent = `Mint submitted · ${tx.hash.slice(0, 12)}… Waiting for confirmation.`;
    const receipt = await tx.wait();
    const event = receipt.logs.map(log => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find(parsed => parsed?.name === 'IttyMinted');
    if (!event) throw new Error('Mint confirmed, but the receipt did not include the expected IttyMinted event.');
    const tokenId = event.args.tokenId.toString();
    ui.tokenId.value = tokenId;
    ui.mintFeedback.textContent = `Itty #${tokenId} minted to ${account.slice(0, 6)}…${account.slice(-4)}.`;
    await loadToken(tokenId);
    ui.lab.scrollIntoView({ behavior: 'smooth' });
    await loadHall();
  } catch (error) {
    ui.mintFeedback.textContent = messageFrom(error);
    ui.mint.disabled = false;
  }
});

ui.unlockForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!contract || !account) {
    ui.labFeedback.textContent = 'Connect your wallet on the collection network first.';
    return;
  }
  const tokenId = ui.tokenId.value.trim();
  if (!/^\d+$/.test(tokenId) || BigInt(tokenId) === 0n) {
    ui.labFeedback.textContent = 'Enter a valid Itty token ID.';
    return;
  }
  ui.unlock.disabled = true;
  ui.labFeedback.textContent = `Checking on-chain ownership of Itty #${tokenId}…`;
  try {
    await loadToken(tokenId);
    ui.labFeedback.textContent = `Workbench unlocked for Itty #${tokenId}.`;
  } catch (error) {
    ui.labContent.hidden = true;
    ui.labFeedback.textContent = messageFrom(error);
  } finally {
    ui.unlock.disabled = false;
  }
});

ui.save.addEventListener('click', async () => {
  if (!contract || !currentTokenId || !currentToken || currentToken.retired) return;
  ui.save.disabled = true;
  ui.saveFeedback.textContent = 'Approve the configuration transaction in your wallet.';
  try {
    const args = [currentTokenId, ...selectedTraits];
    const tx = currentToken.initialized
      ? await contract.restyleItty(...args, { value: await contract.RESTYLE_FEE() })
      : await contract.initializeItty(...args);
    ui.saveFeedback.textContent = `Transaction submitted · ${tx.hash.slice(0, 12)}… Waiting for confirmation.`;
    await tx.wait();
    await loadToken(currentTokenId);
    ui.saveFeedback.textContent = 'Look saved on-chain. Unlocked traits remain in the token wardrobe.';
  } catch (error) {
    ui.saveFeedback.textContent = messageFrom(error);
  } finally {
    ui.save.disabled = currentToken?.retired || false;
  }
});

ui.recordWin.addEventListener('click', async () => {
  if (!contract || !currentTokenId || ui.recordWin.disabled) return;
  ui.recordWin.disabled = true;
  ui.winNote.textContent = 'Confirm the win record in your collection-owner wallet.';
  try {
    const tx = await contract.recordWin(currentTokenId);
    await tx.wait();
    await loadToken(currentTokenId);
    await loadHall();
  } catch (error) {
    ui.winNote.textContent = messageFrom(error);
    ui.recordWin.disabled = false;
  }
});

if (window.ethereum?.on) {
  window.ethereum.on('accountsChanged', () => window.location.reload());
  window.ethereum.on('chainChanged', () => window.location.reload());
}

renderCategory();
renderFashionWorkbench();
renderDossiers();
setWalletLabel();
ui.mint.disabled = true;
ui.unlock.disabled = true;
ui.recordWin.hidden = true;
ui.mintFeedback.textContent = contractReady
  ? 'Connect your wallet on the collection network to begin.'
  : 'Collection contract is not configured yet.';
if (!contractReady) ui.chainStatus.innerHTML = '<span></span> CONTRACT DEPLOYMENT AND NETWORK CONFIGURATION REQUIRED';

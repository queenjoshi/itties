"use client";

import { useEffect, useMemo, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWalletClient } from "wagmi";
import { base } from "wagmi/chains";
import { formatEther, formatUnits, isAddress, zeroAddress, parseAbiItem, parseEther, parseUnits } from "viem";
import { addressesReady, coreAbi, coreAddress, erc20Abi, kingAddress, packsAbi, queenAddress, tournamentAbi, tournamentAddress, packsAddress, launchStartBlock } from "./contracts";

const IMG = "/assets/";
const baseOptions = { chainId: base.id };
const amount = value => Number(value || 0n).toLocaleString("en-US");

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient(baseOptions);
  const { data: walletClient } = useWalletClient(baseOptions);
  const { switchChainAsync } = useSwitchChain();
  const [tokenId, setTokenId] = useState("");
  const [status, setStatus] = useState("");
  const [clock, setClock] = useState(Date.now());
  const [logs, setLogs] = useState([]);
  const [packsBalances, setPacksBalances] = useState({});
  const [adminAddress, setAdminAddress] = useState("");
  const [grantAddress, setGrantAddress] = useState("");
  const [houseRecipient, setHouseRecipient] = useState("");
  const [buyingPack, setBuyingPack] = useState(null);
  const [newCommunity, setNewCommunity] = useState({ community: "DOGE", uri: "", token: "", price: "", weight: "10", cap: "", verified: false });
  const [newPack, setNewPack] = useState({ name: "", uri: "", weight: "10", cap: "", luxury: false });

  const reads = useReadContracts({
    contracts: [
      { address: coreAddress, abi: coreAbi, functionName: "totalSupply" },
      { address: coreAddress, abi: coreAbi, functionName: "HOUSE_POOL_ALLOCATION" },
      { address: coreAddress, abi: coreAbi, functionName: "housePoolRemaining" },
      { address: coreAddress, abi: coreAbi, functionName: "hallOfFameCredits", args: [address || "0x0000000000000000000000000000000000000000"] },
      { address: coreAddress, abi: coreAbi, functionName: "tokensOfOwner", args: [address || "0x0000000000000000000000000000000000000000"] },
      { address: coreAddress, abi: coreAbi, functionName: "getRetiredTokenIds" },
      { address: coreAddress, abi: coreAbi, functionName: "labRevampPasses", args: [address || "0x0000000000000000000000000000000000000000"] },
      { address: packsAddress, abi: packsAbi, functionName: "activePackIds" },
      { address: tournamentAddress, abi: tournamentAbi, functionName: "allTournamentIds" },
      { address: coreAddress, abi: coreAbi, functionName: "isOperator", args: [address || "0x0000000000000000000000000000000000000000"] },
      { address: coreAddress, abi: coreAbi, functionName: "owner" }
    ],
    query: { enabled: addressesReady }
  });
  const [supply, houseAllocation, houseRemaining, hallCredits, ownedIds, retiredIds, revampPasses, expansionIds, tournamentIds, isOperator, contractOwner] = (reads.data || []).map(result => result?.result);
  const isContractOwner = Boolean(address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase());

  const selectedId = tokenId ? BigInt(tokenId) : 0n;
  const tokenReads = useReadContracts({
    contracts: selectedId > 0n ? [
      { address: coreAddress, abi: coreAbi, functionName: "getWinCount", args: [selectedId] },
      { address: coreAddress, abi: coreAbi, functionName: "isRetired", args: [selectedId] },
      { address: coreAddress, abi: coreAbi, functionName: "getAttachedExpansions", args: [selectedId] },
      { address: coreAddress, abi: coreAbi, functionName: "rarityScore", args: [selectedId] },
      { address: coreAddress, abi: coreAbi, functionName: "ownerOf", args: [selectedId] }
    ] : [],
    query: { enabled: addressesReady && selectedId > 0n }
  });
  const [winCount, retired, attachedIds, rarityScore, tokenOwner] = (tokenReads.data || []).map(result => result?.result);

  const expansionReads = useReadContracts({
    contracts: (expansionIds || []).map(id => ({ address: packsAddress, abi: packsAbi, functionName: "packInfo", args: [id] })),
    query: { enabled: addressesReady && Boolean(expansionIds?.length) }
  });
  const paymentReads = useReadContracts({
    contracts: (expansionIds || []).map(id => ({ address: packsAddress, abi: packsAbi, functionName: "communityPayment", args: [id] })),
    query: { enabled: addressesReady && Boolean(expansionIds?.length) }
  });
  const expansionInfo = useMemo(() => (expansionReads.data || []).map((result, index) => ({ id: expansionIds[index], info: result?.result, payment: paymentReads.data?.[index]?.result })).filter(item => item.info), [expansionIds, expansionReads.data, paymentReads.data]);

  const tournamentReads = useReadContracts({
    contracts: (tournamentIds || []).map(id => ({ address: tournamentAddress, abi: tournamentAbi, functionName: "tournamentInfo", args: [id] })),
    query: { enabled: addressesReady && Boolean(tournamentIds?.length) }
  });
  const tournaments = useMemo(() => (tournamentReads.data || []).map((result, index) => ({ id: tournamentIds[index], info: result?.result })).filter(item => item.info), [tournamentIds, tournamentReads.data]);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!addressesReady || !address || !expansionIds?.length || !publicClient) return;
    let cancelled = false;
    Promise.all(expansionIds.map(async id => {
      try { return [id.toString(), await publicClient.readContract({ address: packsAddress, abi: packsAbi, functionName: "balanceOf", args: [address, id] })]; }
      catch { return [id.toString(), 0n]; }
    })).then(entries => { if (!cancelled) setPacksBalances(Object.fromEntries(entries)); });
    return () => { cancelled = true; };
  }, [address, expansionIds, publicClient]);

  useEffect(() => {
    if (!addressesReady || !selectedId || !publicClient) { setLogs([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const latest = await publicClient.getBlockNumber();
        const range = 50000n;
        const batches = [];
        for (let from = launchStartBlock; from <= latest; from += range + 1n) {
          const to = from + range > latest ? latest : from + range;
          batches.push(publicClient.getLogs({ address: coreAddress, event: parseAbiItem("event IttyWon(uint256 indexed tokenId,uint8 winCount,address indexed operator)"), args: { tokenId: selectedId }, fromBlock: from, toBlock: to }));
        }
        const all = (await Promise.all(batches)).flat();
        const history = await Promise.all(all.slice(-24).map(async log => {
          const block = await publicClient.getBlock({ blockHash: log.blockHash });
          return { count: Number(log.args.winCount), operator: log.args.operator, time: Number(block.timestamp), hash: log.transactionHash };
        }));
        if (!cancelled) setLogs(history.reverse());
      } catch { if (!cancelled) setLogs([]); }
    })();
    return () => { cancelled = true; };
  }, [selectedId, publicClient]);

  useEffect(() => { if (isOperator) setOperatorMode(true); }, [isOperator]);

  async function sendCore(functionName, args = [], value) {
    if (!walletClient || chainId !== base.id) throw new Error("Connect your wallet on Base first.");
    const hash = await walletClient.writeContract({ address: coreAddress, abi: coreAbi, functionName, args, value });
    setStatus(`Transaction sent · ${hash.slice(0, 12)}… waiting for Base confirmation`);
    await publicClient.waitForTransactionReceipt({ hash });
    await reads.refetch();
    await tokenReads.refetch();
    setStatus("Confirmed on Base.");
    return hash;
  }

  async function mint() {
    try { setStatus("Approve the 0.025 ETH mint in your wallet."); await sendCore("mintGenesis", [], parseEther("0.025")); }
    catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function claimCredit() {
    try { setStatus("Claim the genesis credit in your wallet."); await sendCore("claimHallOfFameGenesis"); }
    catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function applyLabUpdate() {
    try {
      const passCount = await publicClient.readContract({ address: coreAddress, abi: coreAbi, functionName: "labRevampPasses", args: [address] });
      if (passCount === 0n) {
        for (const tokenAddress of [kingAddress, queenAddress]) {
          const cost = parseUnits("50", 18);
          const [allowance, balance] = await Promise.all([
            publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "allowance", args: [address, coreAddress] }),
            publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [address] })
          ]);
          if (balance < cost) throw new Error(`You need 50 tokens at ${tokenAddress.slice(0, 6)}… before using this update.`);
          if (allowance < cost) {
            const hash = await walletClient.writeContract({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [coreAddress, cost] });
            setStatus("Approve the Lab fee token in your wallet."); await publicClient.waitForTransactionReceipt({ hash });
          }
        }
      }
      await sendCore("applyLabUpdate", [selectedId]);
    } catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function buyPack(id, displayedPayment) {
    if (!walletClient || !address || !publicClient || buyingPack !== null) return;
    try {
      if (chainId !== base.id) throw new Error("Switch your wallet to Base first.");
      if (!displayedPayment) throw new Error("Payment details are unavailable. Please refresh.");
      setBuyingPack(String(id));
      const [item, payment] = await Promise.all([
        publicClient.readContract({ address: packsAddress, abi: packsAbi, functionName: "packInfo", args: [id] }),
        publicClient.readContract({ address: packsAddress, abi: packsAbi, functionName: "communityPayment", args: [id] })
      ]);
      const [paymentToken, unitPrice] = payment;
      if (paymentToken.toLowerCase() !== displayedPayment[0].toLowerCase() || unitPrice !== displayedPayment[1]) {
        await paymentReads.refetch();
        throw new Error("The pack price changed. Review the refreshed price and buy again.");
      }
      const community = paymentToken !== zeroAddress;
      const payments = community ? [[paymentToken, unitPrice]] : [[kingAddress, item[2]], [queenAddress, item[3]]];
      for (const [tokenAddress, cost] of payments) {
        if (cost === 0n) continue;
        const [allowance, balance] = await Promise.all([
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "allowance", args: [address, packsAddress] }),
          publicClient.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "balanceOf", args: [address] })
        ]);
        if (balance < cost) throw new Error("Insufficient balance of the pack’s payment token.");
        if (allowance < cost) {
          setStatus("Approve only the displayed token amount in your wallet.");
          const hash = await walletClient.writeContract({ address: tokenAddress, abi: erc20Abi, functionName: "approve", args: [packsAddress, cost] });
          if ((await publicClient.waitForTransactionReceipt({ hash })).status !== "success") throw new Error("The payment transaction reverted. No pack was purchased.");
        }
      }
      const hash = await walletClient.writeContract({ address: packsAddress, abi: packsAbi,
        functionName: community ? "buyCommunityExpansion" : "buyExpansion",
        args: community ? [id, 1n, paymentToken, unitPrice] : [id, 1n] });
      setStatus("Buying your expansion pack…"); if ((await publicClient.waitForTransactionReceipt({ hash })).status !== "success") throw new Error("The payment transaction reverted. No pack was purchased.");
      const balance = await publicClient.readContract({ address: packsAddress, abi: packsAbi, functionName: "balanceOf", args: [address, id] });
      setPacksBalances(previous => ({ ...previous, [id.toString()]: balance }));
      await expansionReads.refetch();
      setStatus("Expansion added. Payment was sent directly to the House treasury.");
    } catch (error) { setStatus(error.shortMessage || error.message); }
    finally { setBuyingPack(null); }
  }

  async function bindPack(id) {
    if (!walletClient || !address || !selectedId) return;
    try {
      const approved = await publicClient.readContract({ address: packsAddress, abi: packsAbi, functionName: "isApprovedForAll", args: [address, coreAddress] });
      if (!approved) {
        const approvalHash = await walletClient.writeContract({ address: packsAddress, abi: packsAbi, functionName: "setApprovalForAll", args: [coreAddress, true] });
        setStatus("Approve the Lab to bind your expansion."); await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      }
      const hash = await walletClient.writeContract({ address: coreAddress, abi: coreAbi, functionName: "attachExpansion", args: [selectedId, id] });
      setStatus("Binding expansion permanently…"); await publicClient.waitForTransactionReceipt({ hash });
      setPacksBalances(previous => ({ ...previous, [id.toString()]: (previous[id.toString()] || 0n) - 1n }));
      await tokenReads.refetch();
      setStatus("Expansion bound to your Itty’s permanent DNA.");
    } catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function registerTournament(id) {
    try { const hash = await walletClient.writeContract({ address: tournamentAddress, abi: tournamentAbi, functionName: "register", args: [id, selectedId] }); setStatus("Registering your Itty…"); await publicClient.waitForTransactionReceipt({ hash }); await reads.refetch(); setStatus("Itty registered. A Lab revamp pass was credited."); }
    catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function runOperatorAction(id, functionName, args) {
    try { const hash = await walletClient.writeContract({ address: tournamentAddress, abi: tournamentAbi, functionName, args }); setStatus("Operator action submitted…"); await publicClient.waitForTransactionReceipt({ hash }); await reads.refetch(); setStatus("Tournament state updated."); }
    catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function ownerAction(contract, abi, functionName, args, successText) {
    try {
      if (!walletClient || !publicClient || chainId !== base.id) throw new Error("Connect the owner wallet on Base first.");
      const hash = await walletClient.writeContract({ address: contract, abi, functionName, args });
      setStatus("Confirm the House operation in your wallet.");
      if ((await publicClient.waitForTransactionReceipt({ hash })).status !== "success") throw new Error("The House operation reverted.");
      await reads.refetch();
      setStatus(successText);
    } catch (error) { setStatus(error.shortMessage || error.message); }
  }

  async function submitNewPack(event) {
    event.preventDefault();
    const cap = newPack.cap ? BigInt(newPack.cap) : 0n;
    const price = BigInt(newPack.luxury ? 400 : 150) * 10n ** 18n;
    await ownerAction(packsAddress, packsAbi, "createPack", [newPack.name, newPack.uri, price, price, BigInt(newPack.weight), cap, newPack.luxury], "Expansion pack created. Refreshing the catalog.");
  }

  async function submitCommunityPack(event) {
    event.preventDefault();
    try {
      if (!isContractOwner || !newCommunity.verified) throw new Error("Verify the community token on Base before creating the pack.");
      if (!isAddress(newCommunity.token) || newCommunity.token === zeroAddress) throw new Error("Enter a valid Base ERC-20 address.");
      const code = await publicClient.getCode({ address: newCommunity.token });
      if (!code || code === "0x") throw new Error("No token contract exists at this Base address.");
      const decimals = await publicClient.readContract({ address: newCommunity.token, abi: erc20Abi, functionName: "decimals" });
      if (!/^\d+(?:[.]\d+)?$/.test(newCommunity.price) || (newCommunity.price.split(".")[1] || "").length > decimals) throw new Error(`Enter a positive token amount with at most ${decimals} decimal places.`);
      const price = parseUnits(newCommunity.price, decimals);
      if (price <= 0n) throw new Error("Set a positive community-token price.");
      await ownerAction(packsAddress, packsAbi, "createCommunityPack", [newCommunity.community + " Community Pack", newCommunity.uri, newCommunity.token, price, BigInt(newCommunity.weight), BigInt(newCommunity.cap || "0")], "Community pack created with its own token payment.");
    } catch (error) { setStatus(error.shortMessage || error.message); }
  }

  const enabled = addressesReady && chainId === base.id;

  return <>
    <header className="launch-nav"><a className="launch-brand" href="#top" aria-label="Itty Bitty home"><img src={`${IMG}itties-mark.svg`} alt=""/><span className="launch-brand-copy"><span>ITTY BITTY</span><small>THE ITTIES</small></span></a><nav aria-label="Main navigation"><a href="#mint">Mint</a><a href="#lab">The Lab</a><a href="#gauntlet">Gauntlet</a><a href="#expansions">Expansions</a><a href="#vault">Hall of Fame</a></nav><div className="launch-wallet"><ConnectButton.Custom>{({ account, chain, mounted, openConnectModal, openAccountModal, openChainModal }) => {
      const connected = mounted && account && chain;
      const wrongNetwork = connected && chain.unsupported;
      return <button type="button" className="header-wallet-button" onClick={connected ? (wrongNetwork ? openChainModal : openAccountModal) : openConnectModal} aria-label={connected ? (wrongNetwork ? "Switch wallet network" : "Open wallet account") : "Connect wallet"}>
        {connected ? (wrongNetwork ? "Switch network" : account.displayName) : "Connect Wallet"}
      </button>;
    }}</ConnectButton.Custom></div></header>
    <main id="top">
      <section className="launch-hero">
        <div className="launch-hero-copy"><p className="eyebrow"><i/> THE HOUSE OF JOSHI · BASE COLLECTION</p><h1>Blank canvas.<br/><em>Make a legend.</em></h1><p>Meet the bright, odd Itties. Build a character from a blank, then take it on a 52-win climb. Itties are soulbound until they enter the public Hall of Fame vault.</p><div className="launch-actions"><a className="launch-primary" href="#mint">MINT GENESIS · 0.025 ETH ↗</a><a className="launch-secondary" href="#expansions">EXPLORE THE LAB</a></div><div className="launch-stat-row"><span><b>∞</b> PUBLIC SUPPLY</span><span><b>05%</b> SECONDARY ROYALTY</span><span><b>52</b> WINS TO IMMORTALITY</span></div></div>
        <div className="launch-hero-art"><div className="hero-ring"/><img src={`${IMG}itty-trio-cutout.webp`} alt="Three expressive Itties pencil characters"/><span>GENESIS STUDIES · 001–003</span></div>
      </section>

      <section className="launch-mint launch-section" id="mint"><div className="launch-section-title"><p className="eyebrow">01 · GENESIS</p><h2>Meet your <em>first Itty.</em></h2><p>Public supply is unlimited. The separate House pool reserves 200 tokens for VIPs, creator partnerships, and community rewards.</p></div><div className="mint-status-card"><div className="mint-status-top"><span>BASE MAINNET · ERC-721</span><span>ERC-2981 ROYALTY · 5%</span></div><div className="mint-status-stats"><div><small>PUBLIC MINT</small><strong>0.025 ETH</strong></div><div><small>COLLECTION SIZE</small><strong>{supply == null ? "—" : amount(supply)}</strong></div><div><small>HOUSE POOL LEFT</small><strong>{houseRemaining == null ? "200" : amount(houseRemaining)} <small>/ {houseAllocation == null ? "200" : amount(houseAllocation)}</small></strong></div></div><button className="launch-primary" onClick={mint} disabled={!enabled || !isConnected}>Mint a blank Itty <span>↗</span></button>{isConnected && chainId !== base.id && <button className="launch-secondary" onClick={() => switchChainAsync({ chainId: base.id })}>Switch to Base</button>}<p className="launch-disclaimer">Minting is a live Base transaction. Review the amount and network fee in your wallet.</p></div></section>

      <section className="launch-inventory launch-section" id="inventory"><div className="launch-section-title"><p className="eyebrow">YOUR HOUSE FILE</p><h2>Keep your <em>Itties close.</em></h2><p>Connect a wallet on Base to see owned characters, Hall of Fame credits, and Lab passes.</p></div><div className="inventory-panel"><div className="inventory-stat"><small>YOUR ITTIES</small><strong>{ownedIds?.length ?? "—"}</strong></div><div className="inventory-stat"><small>GENESIS CREDITS</small><strong>{hallCredits == null ? "—" : amount(hallCredits)}</strong></div><div className="inventory-stat"><small>LAB REVAMP PASSES</small><strong>{revampPasses == null ? "—" : amount(revampPasses)}</strong></div><div className="owned-list">{ownedIds?.length ? ownedIds.map(id => <button key={String(id)} className={selectedId === id ? "owned-chip selected" : "owned-chip"} onClick={() => setTokenId(String(id))}>ITTY #{String(id)}</button>) : <span>{isConnected ? "No active Itties in this wallet yet." : "Connect your wallet to load your collection."}</span>}</div>{Number(hallCredits || 0n) > 0 && <button className="launch-primary" onClick={claimCredit}>Claim a Genesis Itty credit ↗</button>}</div></section>

      <section className="launch-lab launch-section" id="lab"><div className="launch-section-title"><p className="eyebrow">02 · THE LAB</p><h2>Expand the <em>character.</em></h2><p>Each pack starts tradable. Binding it to an Itty burns the pack and permanently attaches that expansion to its DNA.</p></div><section className="pack-how-it-works" aria-labelledby="pack-guide-title">
        <div className="pack-guide-heading"><h3 id="pack-guide-title">How expansion packs work</h3><p>Pick a pack. Choose its home. Make your Itty your own.</p></div>
        <ol className="pack-guide-steps">
          <li><span aria-hidden="true">01</span><h4>Find your pack</h4><p>Explore the available packs and check their contents, price, and accepted payment token before buying.</p></li>
          <li><span aria-hidden="true">02</span><h4>Pay your way</h4><p>Community packs use their community’s supported token on Base. Regular packs use KING + QUEEN. Connect your wallet, approve the displayed amount, then confirm your purchase. Base network fees are separate.</p></li>
          <li><span aria-hidden="true">03</span><h4>Keep it or trade it</h4><p>Your purchased pack goes into your wallet. Buying does not apply it to an Itty. While it remains unbound, you can hold it, transfer it, or trade it.</p></li>
          <li><span aria-hidden="true">04</span><h4>Make it permanent</h4><p>Select an active Itty you own in the Lab, then choose Bind to Itty. Confirm in your wallet to consume the pack and add its expansion permanently to that Itty’s DNA.</p></li>
        </ol>
        <p className="pack-guide-important"><strong>Choose carefully.</strong> Binding cannot be undone. The pack leaves your wallet and can no longer be traded separately. Its expansion stays with the Itty.</p>
        <details className="pack-guide-faq"><summary>Where does my payment go?</summary><p>Pack payments go directly to the House treasury. Community-pack payments stay in that community’s token, helping the House build holdings across the communities it supports.</p></details>
      </section><div className="lab-grid"><div className="lab-token-card"><img src={`${IMG}itty-sky.webp`} alt="An Itty character concept"/><label htmlFor="token-select">SELECT AN ACTIVE ITTY</label><select id="token-select" value={tokenId} onChange={event => setTokenId(event.target.value)}><option value="">Choose a token…</option>{(ownedIds || []).map(id => <option value={String(id)} key={String(id)}>Itty #{String(id)}</option>)}</select>{selectedId > 0n && <><div className="lab-quick-stats"><span><small>WIN COUNT</small><b>{winCount == null ? "—" : `${winCount} / 52`}</b></span><span><small>RARITY SCORE</small><b>{rarityScore == null ? "—" : amount(rarityScore)}</b></span></div><div className="win-meter"><i style={{ width: `${Math.min(100, Number(winCount || 0) / 52 * 100)}%` }}/></div><button className="launch-secondary full" onClick={applyLabUpdate} disabled={!enabled || Boolean(retired)}>REVAMP / REFRESH LOOK · 50 $KING + 50 $QUEEN</button></>}</div><div className="pack-catalog"><p className="pack-payment-policy"><strong>Community packs · Their token.</strong> Regular packs · KING + QUEEN. Payments go directly to the House treasury. Community-token purchases open after verified Base payment details are published.</p><div className="pack-catalog-head"><span>EXPANSION MARKET</span><span>UNBOUND PACKS ARE TRADEABLE</span></div>{expansionInfo.length ? expansionInfo.map(({ id, info, payment }) => <ExpansionCard key={String(id)} id={id} info={info} payment={payment} canBuy={enabled && isConnected && buyingPack === null} buying={buyingPack === String(id)} owned={packsBalances[String(id)] || 0n} attached={(attachedIds || []).some(attached => attached === id)} onBuy={buyPack} onBind={bindPack} canBind={selectedId > 0n && !retired}/>) : <div className="catalog-empty"><span>✳</span><strong>Expansion packs will appear here</strong><small>Culture · Seasonal · Luxury · Collaboration</small><p>{addressesReady ? "No active pack allocations have been published yet." : "Contract addresses are set after Base Sepolia deployment."}</p></div>}</div></div><div className="launch-status" aria-live="polite">{status || (!addressesReady ? "Configuration needed: add contract and $KING / $QUEEN addresses to .env.local after test deployment." : "Connect a Base wallet to interact with your Lab.")}</div></section>

      {isOperator && <section className="launch-admin launch-section" id="house-admin"><div className="launch-section-title"><p className="eyebrow">HOUSE OPERATIONS · RESTRICTED</p><h2>Run the <em>protocol.</em></h2><p>Operator actions are on-chain and wallet-signed. Only the contract owner can configure House pool mints and new pack definitions.</p></div><div className="admin-grid"><div className="admin-card"><small>COMPETITION OPERATIONS</small><label>Record a verified win<input type="number" min="1" value={tokenId} onChange={event => setTokenId(event.target.value)} placeholder="Itty token ID"/></label><button disabled={!selectedId} onClick={() => ownerAction(coreAddress,coreAbi,"recordWin",[selectedId],"Verified win recorded on Base.")}>RECORD WIN · AUTO RETIRES AT 52</button><label>Grant a Lab revamp pass<input value={grantAddress} onChange={event => setGrantAddress(event.target.value)} placeholder="Holder address"/></label><button disabled={!grantAddress} onClick={() => ownerAction(coreAddress,coreAbi,"grantLabRevampPass",[grantAddress,1n],"One Lab revamp pass granted.")}>GRANT ONE PROMO PASS</button><button onClick={() => runOperatorAction(0n,"createTournament",[6*60*60])}>OPEN 24H TOURNAMENT · 6H REGISTRATION</button></div><div className="admin-card"><small>HOUSE POOL · OWNER ONLY</small><label>Mint a reserved House Itty<input value={houseRecipient} onChange={event => setHouseRecipient(event.target.value)} placeholder="Recipient wallet address"/></label><button disabled={!isContractOwner || !houseRecipient} onClick={() => ownerAction(coreAddress,coreAbi,"mintFromHousePool",[houseRecipient],"House-pool Itty minted.")}>MINT HOUSE POOL TOKEN</button><small>200 reserved tokens · separate from unlimited public supply</small><label>Add a House operator<input value={adminAddress} onChange={event => setAdminAddress(event.target.value)} placeholder="Operator address"/></label><button disabled={!isContractOwner || !adminAddress} onClick={() => ownerAction(coreAddress,coreAbi,"setOperator",[adminAddress,true],"Core operator enabled.")}>AUTHORIZE CORE OPERATOR</button><button disabled={!isContractOwner || !adminAddress} onClick={() => ownerAction(tournamentAddress,tournamentAbi,"setOperator",[adminAddress,true],"Tournament operator enabled.")}>AUTHORIZE TOURNAMENT OPERATOR</button></div><form className="admin-card" onSubmit={submitNewPack}><small>EXPANSION DEFINITIONS · OWNER ONLY</small><label>Pack name<input required value={newPack.name} onChange={event => setNewPack({...newPack,name:event.target.value})} placeholder="Season / culture / luxury pack"/></label><label>Metadata URI<input required value={newPack.uri} onChange={event => setNewPack({...newPack,uri:event.target.value})} placeholder="ipfs://…/metadata.json"/></label><div className="admin-form-row"><label>Rarity weight<input required type="number" min="1" value={newPack.weight} onChange={event => setNewPack({...newPack,weight:event.target.value})}/></label><label>Supply cap<input type="number" min="1" value={newPack.cap} onChange={event => setNewPack({...newPack,cap:event.target.value,luxury:Boolean(event.target.value)})} placeholder="Standard: uncapped"/></label></div><label className="check-label"><input type="checkbox" checked={newPack.luxury} onChange={event => setNewPack({...newPack,luxury:event.target.checked})}/> Luxury pack · 400 $KING + 400 $QUEEN</label><button disabled={!isContractOwner}>CREATE EXPANSION · {newPack.luxury ? "400 + 400" : "150 + 150"} TOKENS</button></form><form className="admin-card" onSubmit={submitCommunityPack}><small>COMMUNITY PACK · OWNER ONLY</small>
<label>Community<select value={newCommunity.community} onChange={e => setNewCommunity({...newCommunity,community:e.target.value})}>{["DOGE","FLOKI","PEPE","SHIBA","TOSHI"].map(name => <option key={name}>{name}</option>)}</select></label>
<label>Verified Base token address<input required value={newCommunity.token} onChange={e => setNewCommunity({...newCommunity,token:e.target.value,verified:false})} placeholder="0x… ERC-20 on Base"/></label>
<label>Price in community tokens<input required type="text" inputMode="decimal" pattern="[0-9]+([.][0-9]+)?" value={newCommunity.price} onChange={e => setNewCommunity({...newCommunity,price:e.target.value})} placeholder="Exact token amount"/></label>
<small>Exact token pricing. A $1 target needs a separately maintained rate; this form does not convert USD.</small>
<label>Metadata URI<input required value={newCommunity.uri} onChange={e => setNewCommunity({...newCommunity,uri:e.target.value})} placeholder="ipfs://…/metadata.json"/></label>
<div className="admin-form-row"><label>Rarity weight<input required type="number" min="1" value={newCommunity.weight} onChange={e => setNewCommunity({...newCommunity,weight:e.target.value})}/></label><label>Supply cap<input type="number" min="1" value={newCommunity.cap} onChange={e => setNewCommunity({...newCommunity,cap:e.target.value})} placeholder="Uncapped"/></label></div>
<label className="check-label"><input type="checkbox" checked={newCommunity.verified} onChange={e => setNewCommunity({...newCommunity,verified:e.target.checked})}/> I verified this community’s official or approved bridged token on Base.</label>
<button disabled={!isContractOwner || !newCommunity.verified}>CREATE COMMUNITY PACK</button></form></div><div className="launch-status" aria-live="polite">{status}</div></section>}

      <section className="launch-gauntlet launch-section" id="gauntlet"><div className="launch-section-title"><p className="eyebrow">03 · COMPETITION</p><h2>The 52-win <em>gauntlet.</em></h2><p>Itties are soulbound throughout the climb. At 52 verified wins, the contract sends the legend to the public, keyless Hall of Fame vault, where it can never re-enter circulation.</p></div><div className="gauntlet-layout"><div className="gauntlet-card"><div className="gauntlet-number">{winCount == null ? "00" : String(winCount).padStart(2, "0")}<small> / 52</small></div><div className="win-meter large"><i style={{ width: `${Math.min(100, Number(winCount || 0) / 52 * 100)}%` }}/></div><p>{retired ? "IMMORTAL · VAULT LOCKED" : selectedId ? `ITTY #${tokenId} · ${Math.max(0, 52 - Number(winCount || 0))} WINS TO RETIREMENT` : "SELECT YOUR ITTY IN THE LAB TO TRACK ITS CLIMB"}</p><div className="gauntlet-history">{logs.length ? logs.map((log, index) => <div key={`${log.hash}-${index}`}><span>WIN #{log.count}</span><time>{new Date(log.time * 1000).toLocaleString()}</time><a target="_blank" rel="noreferrer" href={`https://basescan.org/tx/${log.hash}`}>VIEW ↗</a></div>) : <small>ON-CHAIN WIN HISTORY APPEARS AFTER YOU SELECT AN ITTY.</small>}</div></div><div className="verified-info"><span>01</span><h3>Verified on-chain</h3><p>Authorized tournament operators record wins. The counter only moves forward and can’t be edited down.</p><span>02</span><h3>Automatic retirement</h3><p>At 52 wins, the contract transfers the token to the keyless dead-address vault and credits its holder.</p><span>03</span><h3>Start a new chapter</h3><p>Redeem the credit for a fresh blank genesis Itty and begin again.</p></div></div></section>

      <section className="launch-tournaments launch-section" id="tournaments"><div className="launch-section-title"><p className="eyebrow">04 · FLASH TOURNAMENTS</p><h2>24 hours. <em>One champion.</em></h2><p>Register an active Itty. At the snapshot, bound expansion rarity determines the leaderboard.</p></div><div className="tournament-grid">{tournaments.length ? tournaments.map(({ id, info }) => <TournamentCard key={String(id)} id={id} info={info} clock={clock} selectedId={selectedId} onRegister={registerTournament} onOperatorAction={runOperatorAction} operator={Boolean(isOperator)}/>) : <div className="tournament-empty"><span>COUNTDOWN TO NEXT GAUNTLET</span><strong>— : — : — : —</strong><p>No tournament scheduled. House operators can open the next 24-hour event.</p>{isOperator && <button className="launch-secondary" onClick={() => runOperatorAction(0n, "createTournament", [6 * 60 * 60])}>CREATE TOURNAMENT · 6H REGISTRATION + 24H RUN</button>}</div>}</div></section>

      <section className="launch-vault launch-section" id="vault"><div className="launch-section-title"><p className="eyebrow">05 · THE LASTING MARK</p><h2>52 wins.<br/><em>An immortal legend.</em></h2><p>At 52 verified wins, an Itty moves permanently to the public keyless vault at 0x000…dEaD. It remains viewable on-chain but can never return to active circulation; its former holder receives a fresh genesis credit.</p></div><div className="vault-museum"><div className="vault-head"><span>HOUSE OF JOSHI · IMMORTAL ARCHIVE</span><span>{retiredIds?.length ? `${String(retiredIds.length).padStart(3,"0")} LEGENDS` : "NO LEGENDS YET"}</span></div><div className="vault-gallery">{retiredIds?.length ? retiredIds.map(id => <article key={String(id)}><img src={`${IMG}itty-noir.webp`} alt="Itty Hall of Fame character placeholder"/><strong>ITTY #{String(id)}</strong><small>52 VERIFIED WINS · VAULT-LOCKED</small><a href={`https://basescan.org/token/${coreAddress}?a=${String(id)}`} target="_blank" rel="noreferrer">VIEW ON BASESCAN ↗</a></article>) : <div className="vault-empty"><span>✳</span><strong>Every legend starts as a blank.</strong><small>Only the relentless reach the vault.</small></div>}</div><div className="vault-rewards">{[["01 · GENESIS CREDIT","The Reissued Lab Credit","A fresh blank Itty credit to forge a new character.","/rewards/lab-credit"],["02 · CREATOR SPOTLIGHT","The Creator Spotlight","Guaranteed consideration for rotating media features.","/rewards/creator-spotlight"],["03 · MERCHANDISE","Merchandise Profit-Sharing","Physical lines using the legend’s exact traits, with co-branded profit-sharing.","/rewards/merchandise"]].map(([num,title,copy,href]) => <a href={href} key={title}><small>{num}</small><strong>{title}</strong><p>{copy}</p><b>DISCOVER THE REWARD ↗</b></a>)}</div></div></section>

      <section className="launch-principles launch-section"><p className="eyebrow">THE HOUSE PROMISE</p><div className="principle-grid"><article><span>01</span><h3>Blank by design</h3><p>Identity comes from expansions bound to the token, not a fixed genesis trait roll.</p></article><article><span>02</span><h3>Scarcity with receipts</h3><p>Unopened packs stay transferable. Bound packs become permanent on-chain DNA.</p></article><article><span>03</span><h3>Built for the long run</h3><p>Wins, credit, retirement, and rarity are visible from Base—not hidden in a private database.</p></article></div><small>THE ITTIES · BASE · ERC-721 + ERC-1155 · 5% ERC-2981</small></section>
    </main>
    <footer className="launch-footer"><a className="launch-brand" href="#top"><img src={`${IMG}itties-mark.svg`} alt=""/><span>ITTY BITTY</span></a><span>THE HOUSE OF JOSHI · EVERY LEGEND STARTS AS A BLANK</span><a href="#top">BACK TO TOP ↑</a></footer>
  </>;
}

function ExpansionCard({ id, info, payment, owned, attached, canBind, canBuy, buying, onBuy, onBind }) {
  const [name, uri, kingPrice, queenPrice, weight, cap, minted, active, luxury] = info;
  const community = Boolean(payment && payment[0] !== zeroAddress);
  const tokens = community ? [payment[0]] : [kingAddress, queenAddress];
  const tokenReads = useReadContracts({ contracts: tokens.flatMap(token => [
    { address: token, abi: erc20Abi, functionName: "decimals" },
    { address: token, abi: erc20Abi, functionName: "symbol" }
  ]), query: { enabled: Boolean(payment) } });
  const prices = community ? [payment[1]] : [kingPrice, queenPrice];
  const metadataReady = prices.every((_, index) => tokenReads.data?.[index * 2]?.status === "success" && tokenReads.data?.[index * 2 + 1]?.status === "success");
  const soldOut = cap > 0n && minted >= cap;
  return <article className="pack-row"><div className="pack-icon">{luxury ? "✦" : "✳"}</div><div className="pack-copy"><strong>{name}</strong><small>PACK #{String(id)} · {community ? "COMMUNITY TOKEN" : luxury ? "LUXURY / RATIO-CAPPED" : "KING + QUEEN"} · RARITY +{weight}</small><small>{uri}</small>{community && <a href={`https://basescan.org/token/${payment[0]}`} target="_blank" rel="noreferrer">Payment token on Base ↗</a>}</div><div className="pack-prices">{!payment || !metadataReady ? <small>Payment details unavailable</small> : prices.map((price, index) => <b key={tokens[index]}>{formatUnits(price, tokenReads.data[index * 2].result)} ${tokenReads.data[index * 2 + 1].result}</b>)}</div><button className="pack-buy" disabled={!canBuy || !payment || !metadataReady || !active || soldOut} onClick={() => onBuy(id, payment)}>{buying ? "CONFIRMING…" : soldOut ? "SOLD OUT" : "BUY"} · {Number(owned)}</button>{canBind && Number(owned) > 0 && !attached && <button className="pack-bind" onClick={() => onBind(id)}>BIND TO ITTY</button>}{attached && <span className="bound-label">BOUND DNA</span>}</article>;
}

function TournamentCard({ id, info, clock, selectedId, onRegister, onOperatorAction, operator }) {
  const [created, registrationCloses, endsAt, winnerTokenId, winnerScore, scoreCursor, finalized] = info;
  const entrants = useReadContract({ address: tournamentAddress, abi: tournamentAbi, functionName: "getTournamentEntries", args: [id], query: { enabled: addressesReady } }).data || [];
  const rankedReads = useReadContracts({ contracts: entrants.flatMap(token => [
    { address: coreAddress, abi: coreAbi, functionName: "rarityScore", args: [token] },
    { address: coreAddress, abi: coreAbi, functionName: "ownerOf", args: [token] }
  ]), query: { enabled: addressesReady && entrants.length > 0 } });
  const leaderboard = entrants.map((tokenId, index) => ({
    tokenId,
    score: rankedReads.data?.[index * 2]?.result,
    holder: rankedReads.data?.[index * 2 + 1]?.result
  })).filter(entry => entry.score !== undefined).sort((left, right) => left.score === right.score ? Number(left.tokenId - right.tokenId) : left.score > right.score ? -1 : 1).slice(0, 5);
  const now = Math.floor(clock / 1000);
  const target = now < Number(registrationCloses) ? Number(registrationCloses) : Number(endsAt);
  const remaining = Math.max(0, target - now);
  const time = [Math.floor(remaining / 3600), Math.floor(remaining % 3600 / 60), remaining % 60].map(value => String(value).padStart(2, "0")).join(":");
  const registrationOpen = now >= Number(created) && now < Number(registrationCloses);
  const canScore = operator && now >= Number(endsAt) && !finalized;
  return <article className="tournament-card"><div className="tournament-card-top"><span>FLASH TOURNAMENT · #{String(id)}</span><span>{finalized ? "FINAL" : now < Number(registrationCloses) ? "REGISTRATION" : now < Number(endsAt) ? "LIVE SNAPSHOT" : "SCORING"}</span></div><strong className="tournament-clock">{finalized ? "CHAMPION CROWNED" : time}</strong><p>{finalized ? `WINNER: ITTY #${String(winnerTokenId)} · RARITY ${amount(winnerScore)}` : now < Number(registrationCloses) ? "TIME UNTIL REGISTRATION CLOSES" : now < Number(endsAt) ? "TIME UNTIL 24H SNAPSHOT" : `SCORING · ${scoreCursor} REGISTERED`}</p>{registrationOpen && selectedId > 0n && <button className="launch-primary" onClick={() => onRegister(id)}>REGISTER ITTY #{String(selectedId)} ↗</button>}{canScore && <button className="launch-secondary" onClick={() => onOperatorAction(id,"scoreTournament",[25])}>SCORE NEXT 25 ENTRIES ↗</button>}<div className="tournament-leaderboard"><small>LIVE RARITY LEADERBOARD · {entrants.length} ENTRIES</small>{leaderboard.length ? leaderboard.map((entry, index) => <div key={String(entry.tokenId)}><span>{String(index + 1).padStart(2,"0")} · ITTY #{String(entry.tokenId)}</span><b>RARITY {amount(entry.score)}</b></div>) : <p>Register an active Itty to enter the leaderboard.</p>}</div><small>RARITY SCORE COMES FROM PERMANENTLY BOUND EXPANSIONS.</small></article>;
}

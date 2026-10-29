import { parseAbi } from "viem";

export const coreAddress = process.env.NEXT_PUBLIC_CORE_ADDRESS || process.env.NEXT_PUBLIC_ITTIES_CORE_ADDRESS || "";
export const packsAddress = process.env.NEXT_PUBLIC_PACKS_ADDRESS || process.env.NEXT_PUBLIC_EXPANSION_PACKS_ADDRESS || "";
export const tournamentAddress = process.env.NEXT_PUBLIC_TOURNAMENTS_ADDRESS || process.env.NEXT_PUBLIC_TOURNAMENT_ADDRESS || "";
export const kingAddress = process.env.NEXT_PUBLIC_KING_ADDRESS || process.env.NEXT_PUBLIC_KING_TOKEN_ADDRESS || "";
export const queenAddress = process.env.NEXT_PUBLIC_QUEEN_ADDRESS || process.env.NEXT_PUBLIC_QUEEN_TOKEN_ADDRESS || "";
export const launchStartBlock = BigInt(process.env.NEXT_PUBLIC_START_BLOCK || "0");
export const addressesReady = [coreAddress, packsAddress, tournamentAddress, kingAddress, queenAddress].every(address => /^0x[a-fA-F0-9]{40}$/.test(address));

export const coreAbi = parseAbi([
  "function mintGenesis() payable returns (uint256)",
  "function mintFromHousePool(address to) returns (uint256)",
  "function claimHallOfFameGenesis() returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function HOUSE_POOL_ALLOCATION() view returns (uint256)",
  "function housePoolMinted() view returns (uint256)",
  "function housePoolRemaining() view returns (uint256)",
  "function hallOfFameCredits(address) view returns (uint256)",
  "function tokensOfOwner(address) view returns (uint256[])",
  "function getWinCount(uint256) view returns (uint8)",
  "function isRetired(uint256) view returns (bool)",
  "function getAttachedExpansions(uint256) view returns (uint256[])",
  "function rarityScore(uint256) view returns (uint256)",
  "function labRevampPasses(address) view returns (uint256)",
  "function applyLabUpdate(uint256)",
  "function attachExpansion(uint256,uint256)",
  "function recordWin(uint256)",
  "function grantLabRevampPass(address,uint256)",
  "function getRetiredTokenIds() view returns (uint256[])",
  "function isOperator(address) view returns (bool)",
  "function owner() view returns (address)",
  "function setOperator(address,bool)",
  "function setExpansionPacks(address)",
  "function ownerOf(uint256) view returns (address)",
  "function setTokenURIBase(string)",
  "event IttyMinted(address indexed recipient,uint256 indexed tokenId,bool housePool)",
  "event IttyWon(uint256 indexed tokenId,uint8 winCount,address indexed operator)",
  "event HallOfFameRetired(address indexed formerOwner,uint256 indexed tokenId,uint8 winCount)",
  "event HallOfFameCreditClaimed(address indexed holder,uint256 indexed newTokenId)",
  "event LabRevamped(uint256 indexed tokenId,uint64 revision,address indexed holder,bool usedPass)",
  "event ExpansionAttached(uint256 indexed tokenId,uint256 indexed expansionId)"
]);

export const packsAbi = parseAbi([
  "function activePackIds() view returns (uint256[])",
  "function packInfo(uint256) view returns (string name,string metadataURI,uint256 kingPrice,uint256 queenPrice,uint32 rarityWeight,uint64 supplyCap,uint64 minted,bool active,bool luxury)",
  "function buyExpansion(uint256,uint256)",
  "function communityPayment(uint256) view returns (address token,uint256 unitPrice)",
  "function createCommunityPack(string,string,address,uint256,uint32,uint64) returns (uint256)",
  "function setCommunityPrice(uint256,uint256)",
  "function buyCommunityExpansion(uint256,uint256,address,uint256)",
  "function balanceOf(address,uint256) view returns (uint256)",
  "function setApprovalForAll(address,bool)",
  "function isApprovedForAll(address,address) view returns (bool)",
  "function createPack(string,string,uint256,uint256,uint32,uint64,bool) returns (uint256)",
  "function mintPromotional(address,uint256,uint256)",
  "function setPackActive(uint256,bool)",
  "event ExpansionBought(address indexed buyer,uint256 indexed expansionId,uint256 quantity)",
  "event ExpansionBound(address indexed holder,uint256 indexed tokenId,uint256 indexed expansionId)"
]);

export const tournamentAbi = parseAbi([
  "function activeTournamentIds() view returns (uint256[])",
  "function allTournamentIds() view returns (uint256[])",
  "function tournamentInfo(uint256) view returns (uint64 createdAt,uint64 registrationCloses,uint64 endsAt,uint256 winnerTokenId,uint256 winnerScore,uint32 scoreCursor,bool finalized)",
  "function getTournamentEntries(uint256) view returns (uint256[])",
  "function register(uint256,uint256)",
  "function createTournament(uint32 registrationSeconds)",
  "function scoreTournament(uint256,uint32)",
  "event TournamentCreated(uint256 indexed tournamentId,uint64 registrationCloses,uint64 endsAt)",
  "event TournamentRegistered(uint256 indexed tournamentId,uint256 indexed tokenId,address indexed holder)",
  "event TournamentFinalized(uint256 indexed tournamentId,uint256 indexed winnerTokenId,uint256 winningRarityScore)"
]);

export const erc20Abi = parseAbi([
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function balanceOf(address) view returns (uint256)"
]);

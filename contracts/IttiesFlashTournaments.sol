// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

interface IIttiesTournamentCore {
    function ownerOf(uint256 tokenId) external view returns (address);
    function isRetired(uint256 tokenId) external view returns (bool);
    function rarityScore(uint256 tokenId) external view returns (uint256);
    function grantLabRevampPass(address holder, uint256 quantity) external;
}

/// @notice Operator-assisted 24-hour rarity tournaments over expansions bound on Base.
contract IttiesFlashTournaments is Ownable, Pausable {
    uint64 public constant TOURNAMENT_DURATION = 24 hours;
    uint32 public constant MAX_REGISTRATION = 24 hours;
    uint32 public constant MAX_SCORE_BATCH = 50;

    struct Tournament {
        uint64 createdAt;
        uint64 registrationCloses;
        uint64 endsAt;
        uint256 winnerTokenId;
        uint256 winnerScore;
        uint32 scoreCursor;
        bool finalized;
    }

    IIttiesTournamentCore public immutable core;
    uint256 public nextTournamentId = 1;
    uint256[] private _tournamentIds;
    mapping(uint256 => Tournament) public tournamentInfo;
    mapping(uint256 => uint256[]) private _entries;
    mapping(uint256 => mapping(uint256 => bool)) public tokenRegistered;
    mapping(address => bool) public isOperator;

    event TournamentCreated(uint256 indexed tournamentId, uint64 registrationCloses, uint64 endsAt);
    event TournamentRegistered(uint256 indexed tournamentId, uint256 indexed tokenId, address indexed holder);
    event TournamentScored(uint256 indexed tournamentId, uint32 fromIndex, uint32 throughIndex);
    event TournamentFinalized(uint256 indexed tournamentId, uint256 indexed winnerTokenId, uint256 winningRarityScore);
    event OperatorUpdated(address indexed account, bool enabled);

    error InvalidAddress();
    error InvalidRegistrationPeriod();
    error RegistrationClosed();
    error RegistrationStillOpen();
    error NotTokenHolder();
    error DuplicateEntry();
    error TooManyEntries();
    error InvalidBatchSize();
    error AlreadyFinalized();
    error OnlyOperator();

    constructor(address core_) Ownable(msg.sender) {
        if (core_ == address(0)) revert InvalidAddress();
        core = IIttiesTournamentCore(core_);
    }

    modifier onlyOperator() {
        if (msg.sender != owner() && !isOperator[msg.sender]) revert OnlyOperator();
        _;
    }

    function setOperator(address account, bool enabled) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        isOperator[account] = enabled;
        emit OperatorUpdated(account, enabled);
    }

    function createTournament(uint32 registrationSeconds) external onlyOperator whenNotPaused returns (uint256 id) {
        if (registrationSeconds == 0 || registrationSeconds > MAX_REGISTRATION) revert InvalidRegistrationPeriod();
        id = nextTournamentId++;
        uint64 created = uint64(block.timestamp);
        uint64 closes = created + registrationSeconds;
        uint64 ends = closes + TOURNAMENT_DURATION;
        tournamentInfo[id] = Tournament(created, closes, ends, 0, 0, 0, false);
        _tournamentIds.push(id);
        emit TournamentCreated(id, closes, ends);
    }

    function register(uint256 tournamentId, uint256 tokenId) external whenNotPaused {
        Tournament storage tournament = tournamentInfo[tournamentId];
        if (tournament.createdAt == 0) revert RegistrationClosed();
        if (block.timestamp < tournament.createdAt || block.timestamp >= tournament.registrationCloses) revert RegistrationClosed();
        if (core.ownerOf(tokenId) != msg.sender || core.isRetired(tokenId)) revert NotTokenHolder();
        if (tokenRegistered[tournamentId][tokenId]) revert DuplicateEntry();
        if (_entries[tournamentId].length >= 256) revert TooManyEntries();
        tokenRegistered[tournamentId][tokenId] = true;
        _entries[tournamentId].push(tokenId);
        // A registered participant can receive one House-funded revamp pass.
        core.grantLabRevampPass(msg.sender, 1);
        emit TournamentRegistered(tournamentId, tokenId, msg.sender);
    }

    /// @notice Score entrants in bounded chunks, so finalizing a busy tournament stays callable.
    function scoreTournament(uint256 tournamentId, uint32 batchSize) external onlyOperator whenNotPaused {
        Tournament storage tournament = tournamentInfo[tournamentId];
        if (tournament.createdAt == 0) revert RegistrationClosed();
        if (block.timestamp < tournament.endsAt) revert RegistrationStillOpen();
        if (tournament.finalized) revert AlreadyFinalized();
        if (batchSize == 0 || batchSize > MAX_SCORE_BATCH) revert InvalidBatchSize();

        uint256[] storage entries = _entries[tournamentId];
        uint32 fromIndex = tournament.scoreCursor;
        uint256 end = uint256(fromIndex) + batchSize;
        if (end > entries.length) end = entries.length;
        for (uint256 i = fromIndex; i < end; i++) {
            uint256 tokenId = entries[i];
            if (core.isRetired(tokenId)) continue;
            uint256 score = core.rarityScore(tokenId);
            if (tournament.winnerTokenId == 0 || score > tournament.winnerScore || (score == tournament.winnerScore && tokenId < tournament.winnerTokenId)) {
                tournament.winnerScore = score;
                tournament.winnerTokenId = tokenId;
            }
        }
        tournament.scoreCursor = uint32(end);
        emit TournamentScored(tournamentId, fromIndex, uint32(end));

        if (end == entries.length) {
            tournament.finalized = true;
            if (tournament.winnerTokenId != 0) {
                address holder = core.ownerOf(tournament.winnerTokenId);
                core.grantLabRevampPass(holder, 1);
            }
            emit TournamentFinalized(tournamentId, tournament.winnerTokenId, tournament.winnerScore);
        }
    }

    function activeTournamentIds() external view returns (uint256[] memory ids) {
        uint256 count;
        for (uint256 i; i < _tournamentIds.length; i++) if (!tournamentInfo[_tournamentIds[i]].finalized) count++;
        ids = new uint256[](count);
        uint256 cursor;
        for (uint256 i; i < _tournamentIds.length; i++) if (!tournamentInfo[_tournamentIds[i]].finalized) ids[cursor++] = _tournamentIds[i];
    }

    function allTournamentIds() external view returns (uint256[] memory) { return _tournamentIds; }
    function getTournamentEntries(uint256 tournamentId) external view returns (uint256[] memory) { return _entries[tournamentId]; }
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
}

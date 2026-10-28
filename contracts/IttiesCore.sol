// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IIttiesPacks {
    function burnForBinding(address account, uint256 tokenId, uint256 expansionId) external;
    function rarityWeight(uint256 expansionId) external view returns (uint32);
}

/// @title IttiesCore
/// @notice Base genesis collection, expansion-driven identity, 52-win vault retirement,
///         Hall of Fame genesis credits, and ERC-2981 royalties.
/// @dev The blueprint contradicts itself about transferability during the climb. This
///      implementation follows its core-pillar and security-summary wording: tokens
///      may transfer before 52 wins; after retirement only the dead-address vault owns them.
contract IttiesCore is ERC721URIStorage, ERC2981, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MINT_PRICE = 0.025 ether;
    uint256 public constant HOUSE_POOL_ALLOCATION = 200;
    uint8 public constant WINS_TO_RETIRE = 52;
    uint256 public constant LAB_UPDATE_KING_COST = 50 ether;
    uint256 public constant LAB_UPDATE_QUEEN_COST = 50 ether;
    address public constant HALL_OF_FAME_VAULT = 0x000000000000000000000000000000000000dEaD;

    struct IttyProgress {
        uint8 winCount;
        bool isRetired;
        bool isHallOfFame;
        uint64 labRevision;
    }

    IERC20 public kingToken;
    IERC20 public queenToken;
    address public treasury;
    address public expansionPacks;
    string private _metadataBaseURI;
    uint256 private _nextTokenId = 1;
    uint256 public housePoolMinted;
    uint256 private _retirementTransferToken;

    mapping(uint256 => IttyProgress) public ittyProgress;
    mapping(address => uint256) public hallOfFameCredits;
    mapping(address => uint256) public labRevampPasses;
    mapping(address => bool) private _operators;
    mapping(uint256 => uint256[]) private _attachedExpansions;
    mapping(uint256 => mapping(uint256 => bool)) public hasAttachedExpansion;
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokenIndex;
    uint256[] private _retiredTokenIds;

    event IttyMinted(address indexed recipient, uint256 indexed tokenId, bool housePool);
    event IttyWon(uint256 indexed tokenId, uint8 winCount, address indexed operator);
    event HallOfFameRetired(address indexed formerOwner, uint256 indexed tokenId, uint8 winCount);
    event HallOfFameCreditClaimed(address indexed holder, uint256 indexed newTokenId);
    event LabRevamped(uint256 indexed tokenId, uint64 revision, address indexed holder, bool usedPass);
    event LabRevampPassGranted(address indexed holder, uint256 quantity, address indexed issuer);
    event ExpansionAttached(uint256 indexed tokenId, uint256 indexed expansionId, address indexed holder);
    event OperatorUpdated(address indexed account, bool enabled);
    event TreasuryUpdated(address indexed treasury);
    event RewardTokensUpdated(address indexed kingToken, address indexed queenToken);
    event ExpansionPacksUpdated(address indexed expansionPacks);
    event MetadataBaseURIUpdated(string baseURI);

    error InvalidAddress();
    error InvalidMetadataBaseURI();
    error IncorrectPayment();
    error HousePoolExhausted();
    error HallOfFameCreditRequired();
    error NotTokenHolder();
    error InvalidTokenState();
    error OnlyOperator();
    error ExpansionPacksNotSet();
    error ExpansionAlreadyAttached();
    error ExactTokenPaymentRequired();
    error RetiredTokenLocked();
    error WithdrawalFailed();

    constructor(
        address kingToken_,
        address queenToken_,
        address royaltyReceiver_,
        address treasury_,
        string memory metadataBaseURI_
    ) ERC721("The Itties", "ITTY") Ownable(msg.sender) {
        if (kingToken_ == address(0) || queenToken_ == address(0) || royaltyReceiver_ == address(0) || treasury_ == address(0)) revert InvalidAddress();
        _validateBaseURI(metadataBaseURI_);
        kingToken = IERC20(kingToken_);
        queenToken = IERC20(queenToken_);
        treasury = treasury_;
        _metadataBaseURI = metadataBaseURI_;
        _setDefaultRoyalty(royaltyReceiver_, 500);
    }

    modifier onlyOperator() {
        if (!isOperator(msg.sender)) revert OnlyOperator();
        _;
    }

    function mintGenesis() external payable nonReentrant whenNotPaused returns (uint256 tokenId) {
        if (msg.value != MINT_PRICE) revert IncorrectPayment();
        tokenId = _mintBlank(msg.sender, false);
    }

    /// @notice House allocation is tracked independently; these 200 do not limit public mints.
    function mintFromHousePool(address recipient) external onlyOwner nonReentrant whenNotPaused returns (uint256 tokenId) {
        if (recipient == address(0)) revert InvalidAddress();
        if (housePoolMinted >= HOUSE_POOL_ALLOCATION) revert HousePoolExhausted();
        housePoolMinted++;
        tokenId = _mintBlank(recipient, true);
    }

    function claimHallOfFameGenesis() external nonReentrant whenNotPaused returns (uint256 tokenId) {
        uint256 credits = hallOfFameCredits[msg.sender];
        if (credits == 0) revert HallOfFameCreditRequired();
        hallOfFameCredits[msg.sender] = credits - 1;
        tokenId = _mintBlank(msg.sender, false);
        emit HallOfFameCreditClaimed(msg.sender, tokenId);
    }

    function recordWin(uint256 tokenId) external onlyOperator whenNotPaused {
        address holder = ownerOf(tokenId);
        IttyProgress storage progress = ittyProgress[tokenId];
        if (progress.isRetired) revert InvalidTokenState();
        unchecked { progress.winCount++; }
        emit IttyWon(tokenId, progress.winCount, msg.sender);
        if (progress.winCount == WINS_TO_RETIRE) {
            progress.isRetired = true;
            progress.isHallOfFame = true;
            hallOfFameCredits[holder]++;
            _retiredTokenIds.push(tokenId);
            _retirementTransferToken = tokenId;
            _update(HALL_OF_FAME_VAULT, tokenId, address(0));
            _retirementTransferToken = 0;
            emit HallOfFameRetired(holder, tokenId, progress.winCount);
        }
    }

    /// @notice Recompose the current look; bound expansion DNA remains immutable.
    ///         One tournament/House revamp pass substitutes for the $KING/$QUEEN fee.
    function applyLabUpdate(uint256 tokenId) external nonReentrant whenNotPaused {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenHolder();
        IttyProgress storage progress = ittyProgress[tokenId];
        if (progress.isRetired) revert InvalidTokenState();
        bool usedPass = labRevampPasses[msg.sender] > 0;
        if (usedPass) {
            labRevampPasses[msg.sender]--;
        } else {
            _collectExact(kingToken, msg.sender, LAB_UPDATE_KING_COST);
            _collectExact(queenToken, msg.sender, LAB_UPDATE_QUEEN_COST);
        }
        progress.labRevision++;
        emit LabRevamped(tokenId, progress.labRevision, msg.sender, usedPass);
        emit MetadataUpdate(tokenId);
    }

    /// @notice Attach and burn one free-trading expansion pack. A pack ID can bind only once per Itty.
    function attachExpansion(uint256 tokenId, uint256 expansionId) external nonReentrant whenNotPaused {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenHolder();
        if (ittyProgress[tokenId].isRetired) revert InvalidTokenState();
        if (expansionPacks == address(0)) revert ExpansionPacksNotSet();
        if (hasAttachedExpansion[tokenId][expansionId]) revert ExpansionAlreadyAttached();
        hasAttachedExpansion[tokenId][expansionId] = true;
        IIttiesPacks(expansionPacks).burnForBinding(msg.sender, tokenId, expansionId);
        _attachedExpansions[tokenId].push(expansionId);
        emit ExpansionAttached(tokenId, expansionId, msg.sender);
        emit MetadataUpdate(tokenId);
    }

    function grantLabRevampPass(address holder, uint256 quantity) external onlyOperator {
        if (holder == address(0) || quantity == 0) revert InvalidAddress();
        labRevampPasses[holder] += quantity;
        emit LabRevampPassGranted(holder, quantity, msg.sender);
    }

    function setOperator(address account, bool enabled) external onlyOwner {
        if (account == address(0)) revert InvalidAddress();
        _operators[account] = enabled;
        emit OperatorUpdated(account, enabled);
    }

    function setExpansionPacks(address packs_) external onlyOwner {
        if (packs_ == address(0)) revert InvalidAddress();
        expansionPacks = packs_;
        emit ExpansionPacksUpdated(packs_);
    }

    function setRewardTokens(address kingToken_, address queenToken_) external onlyOwner {
        if (kingToken_ == address(0) || queenToken_ == address(0)) revert InvalidAddress();
        kingToken = IERC20(kingToken_);
        queenToken = IERC20(queenToken_);
        emit RewardTokensUpdated(kingToken_, queenToken_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert InvalidAddress();
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function setRoyaltyReceiver(address receiver) external onlyOwner {
        if (receiver == address(0)) revert InvalidAddress();
        _setDefaultRoyalty(receiver, 500);
    }

    function setTokenURIBase(string calldata baseURI_) external onlyOwner {
        _validateBaseURI(baseURI_);
        _metadataBaseURI = baseURI_;
        emit MetadataBaseURIUpdated(baseURI_);
        emit BatchMetadataUpdate(1, _nextTokenId - 1);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function totalSupply() external view returns (uint256) { return _nextTokenId - 1; }
    function getWinCount(uint256 tokenId) external view returns (uint8) { ownerOf(tokenId); return ittyProgress[tokenId].winCount; }
    function isRetired(uint256 tokenId) external view returns (bool) { ownerOf(tokenId); return ittyProgress[tokenId].isRetired; }
    function isHallOfFame(uint256 tokenId) external view returns (bool) { ownerOf(tokenId); return ittyProgress[tokenId].isHallOfFame; }
    function getAttachedExpansions(uint256 tokenId) external view returns (uint256[] memory) { ownerOf(tokenId); return _attachedExpansions[tokenId]; }
    function getRetiredTokenIds() external view returns (uint256[] memory) { return _retiredTokenIds; }
    function housePoolRemaining() external view returns (uint256) { return HOUSE_POOL_ALLOCATION - housePoolMinted; }
    function tokensOfOwner(address holder) external view returns (uint256[] memory) { return _ownedTokens[holder]; }
    function metadataBaseURI() external view returns (string memory) { return _metadataBaseURI; }
    function isOperator(address account) public view returns (bool) { return account == owner() || _operators[account]; }

    function rarityScore(uint256 tokenId) external view returns (uint256 score) {
        ownerOf(tokenId);
        if (expansionPacks == address(0)) return 0;
        uint256[] storage attached = _attachedExpansions[tokenId];
        for (uint256 i; i < attached.length; i++) score += IIttiesPacks(expansionPacks).rarityWeight(attached[i]);
    }

    function withdrawMintProceeds(address payable recipient) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();
        (bool success,) = recipient.call{value: address(this).balance}("");
        if (!success) revert WithdrawalFailed();
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        ownerOf(tokenId);
        return string.concat(_metadataBaseURI, _toString(tokenId), ".json");
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorage, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _mintBlank(address recipient, bool fromHousePool) private returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(recipient, tokenId);
        emit IttyMinted(recipient, tokenId, fromHousePool);
    }

    function _collectExact(IERC20 token, address payer, uint256 amount) private {
        uint256 beforeBalance = token.balanceOf(treasury);
        token.safeTransferFrom(payer, treasury, amount);
        if (token.balanceOf(treasury) - beforeBalance != amount) revert ExactTokenPaymentRequired();
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721) whenNotPaused returns (address from)
    {
        from = _ownerOf(tokenId);
        if (from == HALL_OF_FAME_VAULT && to != address(0)) revert RetiredTokenLocked();
        if (from != address(0) && to == HALL_OF_FAME_VAULT) {
            if (_retirementTransferToken != tokenId || !ittyProgress[tokenId].isRetired) revert RetiredTokenLocked();
        }
        if (from != address(0)) _removeOwnedToken(from, tokenId);
        address previousOwner = super._update(to, tokenId, auth);
        if (to != address(0)) _addOwnedToken(to, tokenId);
        return previousOwner;
    }

    function _addOwnedToken(address holder, uint256 tokenId) private {
        _ownedTokenIndex[tokenId] = _ownedTokens[holder].length;
        _ownedTokens[holder].push(tokenId);
    }

    function _removeOwnedToken(address holder, uint256 tokenId) private {
        uint256 index = _ownedTokenIndex[tokenId];
        uint256 lastIndex = _ownedTokens[holder].length - 1;
        if (index != lastIndex) {
            uint256 moved = _ownedTokens[holder][lastIndex];
            _ownedTokens[holder][index] = moved;
            _ownedTokenIndex[moved] = index;
        }
        _ownedTokens[holder].pop();
        delete _ownedTokenIndex[tokenId];
    }

    function _validateBaseURI(string memory baseURI_) private pure {
        bytes memory value = bytes(baseURI_);
        if (value.length == 0 || value[value.length - 1] != bytes1("/")) revert InvalidMetadataBaseURI();
    }

    function _baseURI() internal view override returns (string memory) { return _metadataBaseURI; }

    function _toString(uint256 value) private pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buffer = new bytes(digits);
        while (value != 0) { digits -= 1; buffer[digits] = bytes1(uint8(48 + uint256(value % 10))); value /= 10; }
        return string(buffer);
    }
}

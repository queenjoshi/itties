// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Freely tradable expansion packs. Applying one burns the pack and
/// permanently binds its ID to an IttiesCore token.
contract IttiesExpansionPacks is ERC1155, ERC2981, Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Pack {
        string name;
        string metadataURI;
        uint256 kingPrice;
        uint256 queenPrice;
        uint32 rarityWeight;
        uint64 supplyCap; // zero means uncapped
        uint64 minted;
        bool active;
        bool luxury;
    }

    struct CommunityPayment {
        address token;
        uint256 unitPrice;
    }

    mapping(uint256 => CommunityPayment) public communityPayment;

    IERC20 public kingToken;
    IERC20 public queenToken;
    address public treasury;
    address public ittiesCore;
    uint256 public nextPackId = 1;
    uint256[] private _allPackIds;
    mapping(uint256 => Pack) private _packs;
    mapping(uint256 => string) private _uris;

    event PackCreated(uint256 indexed expansionId, string name, uint32 rarityWeight, uint64 supplyCap, bool luxury);
    event ExpansionBought(address indexed buyer, uint256 indexed expansionId, uint256 quantity);
    event ExpansionBound(address indexed holder, uint256 indexed tokenId, uint256 indexed expansionId);
    event PackStatusChanged(uint256 indexed expansionId, bool active);
    event PaymentTokensChanged(address indexed kingToken, address indexed queenToken);
    event CommunityPaymentConfigured(uint256 indexed expansionId, address indexed token, uint256 unitPrice);
    event CommunityPaymentReceived(address indexed buyer, uint256 indexed expansionId, address indexed token, uint256 amount);
    event TreasuryChanged(address indexed treasury);

    error InvalidAddress();
    error WrongPaymentRoute();
    error PaymentQuoteChanged();
    error InvalidPack();
    error PackUnavailable();
    error CapExceeded();
    error OnlyIttiesCore();
    error OnlyOnce();
    error ExactTokenPaymentRequired();

    constructor(address kingToken_, address queenToken_, address treasury_, address royaltyReceiver_)
        ERC1155("") Ownable(msg.sender)
    {
        if (kingToken_ == address(0) || queenToken_ == address(0) || treasury_ == address(0) || royaltyReceiver_ == address(0)) revert InvalidAddress();
        kingToken = IERC20(kingToken_);
        queenToken = IERC20(queenToken_);
        treasury = treasury_;
        _setDefaultRoyalty(royaltyReceiver_, 500);
    }

    function createPack(
        string calldata name_,
        string calldata metadataURI_,
        uint256 kingPrice_,
        uint256 queenPrice_,
        uint32 rarityWeight_,
        uint64 supplyCap_,
        bool luxury_
    ) external onlyOwner returns (uint256 expansionId) {
        return _createPack(name_, metadataURI_, kingPrice_, queenPrice_, rarityWeight_, supplyCap_, luxury_);
    }

    /// @notice Community tokens must be verified Base ERC-20 contracts by the owner.
    /// Prices are exact token base units, not an automatic USD conversion.
    function createCommunityPack(
        string calldata name_, string calldata metadataURI_, address token_, uint256 unitPrice_,
        uint32 rarityWeight_, uint64 supplyCap_
    ) external onlyOwner returns (uint256 expansionId) {
        _validateCommunityPayment(token_, unitPrice_);
        expansionId = _createPack(name_, metadataURI_, 0, 0, rarityWeight_, supplyCap_, false);
        communityPayment[expansionId] = CommunityPayment(token_, unitPrice_);
        emit CommunityPaymentConfigured(expansionId, token_, unitPrice_);
    }

    function setCommunityPrice(uint256 expansionId, uint256 unitPrice_) external onlyOwner {
        CommunityPayment storage payment = communityPayment[expansionId];
        if (payment.token == address(0) || unitPrice_ == 0) revert InvalidPack();
        payment.unitPrice = unitPrice_;
        emit CommunityPaymentConfigured(expansionId, payment.token, unitPrice_);
    }

    function _validateCommunityPayment(address token_, uint256 unitPrice_) private view {
        if (token_ == address(0) || token_.code.length == 0) revert InvalidAddress();
        if (unitPrice_ == 0) revert InvalidPack();
    }

    function _createPack(
        string memory name_, string memory metadataURI_, uint256 kingPrice_, uint256 queenPrice_,
        uint32 rarityWeight_, uint64 supplyCap_, bool luxury_
    ) private returns (uint256 expansionId) {
        if (bytes(name_).length == 0 || bytes(metadataURI_).length == 0 || rarityWeight_ == 0) revert InvalidPack();
        if (luxury_ && supplyCap_ == 0) revert InvalidPack();
        expansionId = nextPackId++;
        _packs[expansionId] = Pack(name_, metadataURI_, kingPrice_, queenPrice_, rarityWeight_, supplyCap_, 0, true, luxury_);
        _uris[expansionId] = metadataURI_;
        _allPackIds.push(expansionId);
        emit PackCreated(expansionId, name_, rarityWeight_, supplyCap_, luxury_);
    }

    function buyExpansion(uint256 expansionId, uint256 quantity) external nonReentrant whenNotPaused {
        if (communityPayment[expansionId].token != address(0)) revert WrongPaymentRoute();
        Pack storage pack = _packs[expansionId];
        if (!pack.active) revert PackUnavailable();
        if (quantity == 0) revert InvalidPack();
        if (quantity > type(uint64).max - uint256(pack.minted)) revert CapExceeded();
        if (pack.supplyCap != 0 && uint256(pack.minted) + quantity > pack.supplyCap) revert CapExceeded();
        uint256 kingCost = pack.kingPrice * quantity;
        uint256 queenCost = pack.queenPrice * quantity;
        _collectExact(kingToken, kingCost);
        _collectExact(queenToken, queenCost);
        pack.minted += uint64(quantity);
        _mint(msg.sender, expansionId, quantity, "");
        emit ExpansionBought(msg.sender, expansionId, quantity);
    }

    /// @notice Both quote fields must match the displayed checkout. An owner price
    /// update during approval causes a revert instead of charging a new amount.
    function buyCommunityExpansion(
        uint256 expansionId, uint256 quantity, address expectedToken, uint256 expectedUnitPrice
    ) external nonReentrant whenNotPaused {
        CommunityPayment memory payment = communityPayment[expansionId];
        if (payment.token == address(0)) revert WrongPaymentRoute();
        if (payment.token != expectedToken || payment.unitPrice != expectedUnitPrice) revert PaymentQuoteChanged();
        Pack storage pack = _packs[expansionId];
        if (!pack.active) revert PackUnavailable();
        if (quantity == 0) revert InvalidPack();
        if (quantity > type(uint64).max - uint256(pack.minted)) revert CapExceeded();
        if (pack.supplyCap != 0 && uint256(pack.minted) + quantity > pack.supplyCap) revert CapExceeded();
        uint256 cost = payment.unitPrice * quantity;
        _collectExact(IERC20(payment.token), cost);
        pack.minted += uint64(quantity);
        _mint(msg.sender, expansionId, quantity, "");
        emit ExpansionBought(msg.sender, expansionId, quantity);
        emit CommunityPaymentReceived(msg.sender, expansionId, payment.token, cost);
    }

    function mintPromotional(address recipient, uint256 expansionId, uint256 quantity) external onlyOwner whenNotPaused {
        Pack storage pack = _packs[expansionId];
        if (recipient == address(0) || !pack.active || quantity == 0) revert InvalidPack();
        if (quantity > type(uint64).max - uint256(pack.minted)) revert CapExceeded();
        if (pack.supplyCap != 0 && uint256(pack.minted) + quantity > pack.supplyCap) revert CapExceeded();
        pack.minted += uint64(quantity);
        _mint(recipient, expansionId, quantity, "");
        emit ExpansionBought(recipient, expansionId, quantity);
    }

    /// @dev Called only by the core after it verifies the caller owns the Itty.
    function burnForBinding(address account, uint256 tokenId, uint256 expansionId) external {
        if (msg.sender != ittiesCore) revert OnlyIttiesCore();
        _burn(account, expansionId, 1);
        emit ExpansionBound(account, tokenId, expansionId);
    }

    function setIttiesCore(address core_) external onlyOwner {
        if (core_ == address(0)) revert InvalidAddress();
        if (ittiesCore != address(0)) revert OnlyOnce();
        ittiesCore = core_;
    }

    function setPaymentTokens(address kingToken_, address queenToken_) external onlyOwner {
        if (kingToken_ == address(0) || queenToken_ == address(0)) revert InvalidAddress();
        kingToken = IERC20(kingToken_);
        queenToken = IERC20(queenToken_);
        emit PaymentTokensChanged(kingToken_, queenToken_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert InvalidAddress();
        treasury = treasury_;
        emit TreasuryChanged(treasury_);
    }

    function setPackActive(uint256 expansionId, bool active) external onlyOwner {
        if (_packs[expansionId].minted == 0 && bytes(_packs[expansionId].name).length == 0) revert InvalidPack();
        _packs[expansionId].active = active;
        emit PackStatusChanged(expansionId, active);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }
    function activePackIds() external view returns (uint256[] memory ids) {
        uint256 count;
        for (uint256 i; i < _allPackIds.length; i++) if (_packs[_allPackIds[i]].active) count++;
        ids = new uint256[](count);
        uint256 cursor;
        for (uint256 i; i < _allPackIds.length; i++) if (_packs[_allPackIds[i]].active) ids[cursor++] = _allPackIds[i];
    }
    function allPackIds() external view returns (uint256[] memory) { return _allPackIds; }
    function packInfo(uint256 expansionId) external view returns (
        string memory name, string memory metadataURI, uint256 kingPrice, uint256 queenPrice,
        uint32 rarityWeight_, uint64 supplyCap, uint64 minted, bool active, bool luxury
    ) {
        Pack storage pack = _packs[expansionId];
        return (pack.name, pack.metadataURI, pack.kingPrice, pack.queenPrice, pack.rarityWeight, pack.supplyCap, pack.minted, pack.active, pack.luxury);
    }
    function rarityWeight(uint256 expansionId) external view returns (uint32) { return _packs[expansionId].rarityWeight; }
    function uri(uint256 expansionId) public view override returns (string memory) { return _uris[expansionId]; }

    function _collectExact(IERC20 token, uint256 amount) private {
        if (amount == 0) return;
        uint256 beforeBalance = token.balanceOf(treasury);
        token.safeTransferFrom(msg.sender, treasury, amount);
        if (token.balanceOf(treasury) - beforeBalance != amount) revert ExactTokenPaymentRequired();
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal override whenNotPaused
    {
        super._update(from, to, ids, values);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @notice On-chain ownership, Lab looks, permanent trait wardrobes and retirement.
/// @dev Deploy with the chosen collection supply, per-wallet mint limit and metadata URL.
contract IttyLabProtocol is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    uint256 public constant MINT_PRICE = 0.02 ether;
    uint256 public constant RESTYLE_FEE = 0.00025 ether;
    uint8 public constant TRAIT_COUNT = 7;
    uint8 public constant OPTION_COUNT = 6;
    uint8 public constant WINS_TO_RETIRE = 10;

    struct IttyTraits {
        uint8 bodyColor;
        uint8 eraserColor;
        uint8 eyes;
        uint8 mouth;
        uint8 expression;
        uint8 accessory;
        uint8 motionEffect;
        bool isInitialized;
        bool isRetired;
        uint8 winsCount;
    }

    uint256 public immutable maxSupply;
    uint256 public immutable maxPerWallet;
    uint256 private _nextTokenId = 1;
    string private _baseTokenURI;

    mapping(uint256 tokenId => IttyTraits) public ittyConfigurations;
    mapping(uint256 tokenId => mapping(uint8 category => mapping(uint8 option => bool owned)))
        public tokenWardrobe;
    mapping(address account => uint256 minted) public mintedBy;
    uint256[] private _retiredTokenIds;

    event IttyMinted(address indexed owner, uint256 indexed tokenId);
    event IttyInitialized(uint256 indexed tokenId, uint8[7] traits);
    event IttyRestyled(uint256 indexed tokenId, uint8[7] traits);
    event WinRecorded(uint256 indexed tokenId, uint8 winsCount, bool retired);
    event MetadataUpdate(uint256 indexed tokenId);

    error InvalidSupply();
    error InvalidMetadataBaseURI();
    error WalletMintLimitReached();
    error SoldOut();
    error IncorrectPayment();
    error NotTokenOwner();
    error AlreadyInitialized();
    error InvalidTokenState();
    error InvalidTraitOption();
    error WithdrawFailed();

    constructor(
        string memory baseURI_,
        uint256 maxSupply_,
        uint256 maxPerWallet_
    ) ERC721("Itty Pencil", "ITTY") Ownable(msg.sender) {
        if (maxSupply_ == 0 || maxPerWallet_ == 0 || maxPerWallet_ > maxSupply_) {
            revert InvalidSupply();
        }
        bytes memory uri = bytes(baseURI_);
        if (uri.length == 0 || uri[uri.length - 1] != bytes1("/")) revert InvalidMetadataBaseURI();
        maxSupply = maxSupply_;
        maxPerWallet = maxPerWallet_;
        _baseTokenURI = baseURI_;
    }

    function mintItty() external payable nonReentrant {
        if (msg.value != MINT_PRICE) revert IncorrectPayment();
        if (_nextTokenId > maxSupply) revert SoldOut();
        if (mintedBy[msg.sender] >= maxPerWallet) revert WalletMintLimitReached();

        uint256 tokenId = _nextTokenId++;
        mintedBy[msg.sender]++;
        _safeMint(msg.sender, tokenId);
        emit IttyMinted(msg.sender, tokenId);
    }

    function initializeItty(
        uint256 tokenId,
        uint8 bodyColor,
        uint8 eraserColor,
        uint8 eyes,
        uint8 mouth,
        uint8 expression,
        uint8 accessory,
        uint8 motionEffect
    ) external {
        _requireTokenOwner(tokenId);
        IttyTraits storage itty = ittyConfigurations[tokenId];
        if (itty.isInitialized || itty.isRetired) revert AlreadyInitialized();
        uint8[7] memory traits = [bodyColor, eraserColor, eyes, mouth, expression, accessory, motionEffect];
        _validateTraits(traits);
        _saveTraits(tokenId, itty, traits);
        itty.isInitialized = true;
        emit IttyInitialized(tokenId, traits);
        emit MetadataUpdate(tokenId);
    }

    function restyleItty(
        uint256 tokenId,
        uint8 bodyColor,
        uint8 eraserColor,
        uint8 eyes,
        uint8 mouth,
        uint8 expression,
        uint8 accessory,
        uint8 motionEffect
    ) external payable {
        _requireTokenOwner(tokenId);
        IttyTraits storage itty = ittyConfigurations[tokenId];
        if (!itty.isInitialized || itty.isRetired) revert InvalidTokenState();
        if (msg.value != RESTYLE_FEE) revert IncorrectPayment();
        uint8[7] memory traits = [bodyColor, eraserColor, eyes, mouth, expression, accessory, motionEffect];
        _validateTraits(traits);
        _saveTraits(tokenId, itty, traits);
        emit IttyRestyled(tokenId, traits);
        emit MetadataUpdate(tokenId);
    }

    /// @notice Called by the collection owner / authorized leaderboard operator.
    function recordWin(uint256 tokenId) external onlyOwner {
        IttyTraits storage itty = ittyConfigurations[tokenId];
        if (!itty.isInitialized || itty.isRetired) revert InvalidTokenState();
        unchecked {
            itty.winsCount++;
        }
        if (itty.winsCount >= WINS_TO_RETIRE) {
            itty.isRetired = true;
            _retiredTokenIds.push(tokenId);
        }
        emit WinRecorded(tokenId, itty.winsCount, itty.isRetired);
    }

    function retiredTokenIds() external view returns (uint256[] memory) {
        return _retiredTokenIds;
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string.concat(_baseTokenURI, tokenId.toString(), ".json");
    }

    function withdraw(address payable recipient) external onlyOwner nonReentrant {
        (bool success,) = recipient.call{value: address(this).balance}("");
        if (!success) revert WithdrawFailed();
    }

    function _requireTokenOwner(uint256 tokenId) private view {
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
    }

    function _validateTraits(uint8[7] memory traits) private pure {
        for (uint8 category; category < TRAIT_COUNT; ++category) {
            if (traits[category] >= OPTION_COUNT) revert InvalidTraitOption();
        }
    }

    function _saveTraits(
        uint256 tokenId,
        IttyTraits storage itty,
        uint8[7] memory traits
    ) private {
        itty.bodyColor = traits[0];
        itty.eraserColor = traits[1];
        itty.eyes = traits[2];
        itty.mouth = traits[3];
        itty.expression = traits[4];
        itty.accessory = traits[5];
        itty.motionEffect = traits[6];
        for (uint8 category; category < TRAIT_COUNT; ++category) {
            tokenWardrobe[tokenId][category][traits[category]] = true;
        }
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        if (to != address(0) && _ownerOf(tokenId) != to && balanceOf(to) >= maxPerWallet) {
            revert WalletMintLimitReached();
        }
        return super._update(to, tokenId, auth);
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}

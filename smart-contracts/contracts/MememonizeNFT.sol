// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Import OpenZeppelin ERC721 Implementation and Ownable for access control
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MememonizeNFT
 * @dev ERC-721 compliant token representing unique Mememonize assets.
 * This contract includes marketplace functionality for listing and purchasing NFTs.
 */
contract MememonizeNFT is ERC721, Ownable {
    // Token counter for unique token IDs
    uint256 private _tokenIdCounter;

    // Mapping for token URIs
    mapping(uint256 => string) private _tokenURIs;
    
    // Mapping for sale prices. If a token is not for sale, its price is 0.
    mapping(uint256 => uint256) public salePrices;
    
    // Event emitted when an NFT is purchased
    event NFTPurchased(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);

    /**
     * @dev Initializes the contract by setting a name and a symbol for the NFT.
     */
    constructor() ERC721("Mememonize NFT", "MNFT") {
        _tokenIdCounter = 1; // Start from 1 instead of 0
    }

    /**
     * @notice Mint a new NFT and list it for sale automatically.
     * @param recipient The address that will own the minted NFT.
     * @param tokenURI The token URI that points to the NFT metadata.
     * @param price The sale price in wei for which the NFT will be listed.
     * @return The newly minted token ID.
     */
    function mintNFT(address recipient, string memory tokenURI, uint256 price) public returns (uint256) {
        require(price > 0, "Price must be greater than zero");
        uint256 newTokenId = _tokenIdCounter;
        _safeMint(recipient, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        // Automatically list NFT for sale by setting its sale price.
        salePrices[newTokenId] = price;

        _tokenIdCounter += 1;
        return newTokenId;
    }

    /**
     * @dev Internal function to set the token URI for a given tokenId.
     * Reverts if the tokenId does not exist.
     * @param tokenId uint256 ID of the token.
     * @param tokenURI string URI to assign.
     */
    function _setTokenURI(uint256 tokenId, string memory tokenURI) internal virtual {
        require(_exists(tokenId), "MememonizeNFT: URI set of nonexistent token");
        _tokenURIs[tokenId] = tokenURI;
    }


    /**
     * @notice Purchase an NFT that is listed for sale.
     * Buyer sends the required ETH and the token is transferred to the buyer.
     * @param tokenId The token ID to purchase.
     */
    function purchaseNFT(uint256 tokenId) public payable {
        uint256 price = salePrices[tokenId];
        address seller = ownerOf(tokenId);
        require(price > 0, "Token is not for sale");
        require(msg.value >= price, "Insufficient funds sent");
        require(seller != msg.sender, "Buyer cannot be the seller");

        // Transfer ETH to the seller using call to prevent reentrancy issues
        (bool sentToSeller, ) = payable(seller).call{value: price}("");
        require(sentToSeller, "Failed to transfer ETH to seller");

        // Refund any excess ETH sent to the buyer
        if (msg.value > price) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - price}("");
            require(refunded, "Failed to refund excess funds");
        }

        // Clear the sale price so the token is no longer listed
        salePrices[tokenId] = 0;

        // Transfer the NFT from the seller to the buyer
        _safeTransfer(seller, msg.sender, tokenId, "");

        // Emit an event for off-chain tracking
        emit NFTPurchased(tokenId, seller, msg.sender, price);
    }

    /**
     * @dev Returns the token URI for the given tokenId.
     * Reverts if the tokenId does not exist.
     * @param tokenId uint256 ID of the token.
     * @return string URI associated with the token.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "MememonizeNFT: URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
}

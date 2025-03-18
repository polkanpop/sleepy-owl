// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MememonizeEscrow {
    // Struct to store asset information
    struct Asset {
        uint256 id;
        string name;
        uint256 price;
        address owner;
        bool isAvailable;
    }
    
    // Struct to store transaction information
    struct Transaction {
        uint256 id;
        uint256 assetId;
        address buyer;
        address seller;
        uint256 price;
        TransactionStatus status;
        uint256 timestamp;
    }
    
    // Enum for transaction status
    enum TransactionStatus { Pending, Completed, Cancelled }
    
    // Mapping from asset ID to Asset
    mapping(uint256 => Asset) public assets;
    
    // Mapping from transaction ID to Transaction
    mapping(uint256 => Transaction) public transactions;
    
    // Counter for asset IDs
    uint256 private nextAssetId = 1;
    
    // Counter for transaction IDs
    uint256 private nextTransactionId = 1;
    
    // Events
    event AssetListed(uint256 indexed assetId, string name, uint256 price, address owner);
    event AssetPurchased(uint256 indexed assetId, uint256 indexed transactionId, address buyer, address seller, uint256 price);
    event TransactionCompleted(uint256 indexed transactionId);
    event TransactionCancelled(uint256 indexed transactionId);
    
    // Modifiers
    modifier onlyAssetOwner(uint256 assetId) {
        require(assets[assetId].owner == msg.sender, "Not the asset owner");
        _;
    }
    
    modifier onlyBuyer(uint256 transactionId) {
        require(transactions[transactionId].buyer == msg.sender, "Not the buyer");
        _;
    }
    
    modifier onlySeller(uint256 transactionId) {
        require(transactions[transactionId].seller == msg.sender, "Not the seller");
        _;
    }
    
    // List a new asset for sale
    function listAsset(string memory name, uint256 price) external returns (uint256) {
        uint256 assetId = nextAssetId++;
        
        assets[assetId] = Asset({
            id: assetId,
            name: name,
            price: price,
            owner: msg.sender,
            isAvailable: true
        });
        
        emit AssetListed(assetId, name, price, msg.sender);
        
        return assetId;
    }
    
    // Purchase an asset (creates a transaction and holds funds in escrow)
    function purchaseAsset(uint256 assetId) external payable returns (uint256) {
        Asset storage asset = assets[assetId];
        
        require(asset.isAvailable, "Asset not available");
        require(msg.value == asset.price, "Incorrect payment amount");
        require(msg.sender != asset.owner, "Cannot buy your own asset");
        
        uint256 transactionId = nextTransactionId++;
        
        transactions[transactionId] = Transaction({
            id: transactionId,
            assetId: assetId,
            buyer: msg.sender,
            seller: asset.owner,
            price: asset.price,
            status: TransactionStatus.Pending,
            timestamp: block.timestamp
        });
        
        // Mark asset as unavailable while in transaction
        asset.isAvailable = false;
        
        emit AssetPurchased(assetId, transactionId, msg.sender, asset.owner, asset.price);
        
        return transactionId;
    }
    
    // Complete a transaction (release funds to seller and transfer asset to buyer)
    function completeTransaction(uint256 transactionId) external onlyBuyer(transactionId) {
        Transaction storage transaction = transactions[transactionId];
        
        require(transaction.status == TransactionStatus.Pending, "Transaction not pending");
        
        // Update transaction status
        transaction.status = TransactionStatus.Completed;
        
        // Transfer asset ownership
        Asset storage asset = assets[transaction.assetId];
        asset.owner = transaction.buyer;
        asset.isAvailable = true;  // Make it available for the new owner to sell
        
        // Transfer funds to seller
        payable(transaction.seller).transfer(transaction.price);
        
        emit TransactionCompleted(transactionId);
    }
    
    // Cancel a transaction (refund buyer and return asset to seller)
    function cancelTransaction(uint256 transactionId) external {
        Transaction storage transaction = transactions[transactionId];
        
        require(transaction.status == TransactionStatus.Pending, "Transaction not pending");
        require(msg.sender == transaction.buyer || msg.sender == transaction.seller, "Not authorized");
        
        // Update transaction status
        transaction.status = TransactionStatus.Cancelled;
        
        // Make asset available again
        Asset storage asset = assets[transaction.assetId];
        asset.isAvailable = true;
        
        // Refund buyer
        payable(transaction.buyer).transfer(transaction.price);
        
        emit TransactionCancelled(transactionId);
    }
    
    // Get asset details
    function getAsset(uint256 assetId) external view returns (
        uint256 id,
        string memory name,
        uint256 price,
        address owner,
        bool isAvailable
    ) {
        Asset storage asset = assets[assetId];
        return (asset.id, asset.name, asset.price, asset.owner, asset.isAvailable);
    }
    
    // Get transaction details
    function getTransaction(uint256 transactionId) external view returns (
        uint256 id,
        uint256 assetId,
        address buyer,
        address seller,
        uint256 price,
        TransactionStatus status,
        uint256 timestamp
    ) {
        Transaction storage transaction = transactions[transactionId];
        return (
            transaction.id,
            transaction.assetId,
            transaction.buyer,
            transaction.seller,
            transaction.price,
            transaction.status,
            transaction.timestamp
        );
    }
}


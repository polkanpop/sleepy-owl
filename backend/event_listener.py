import os
import json
import time
import logging

from web3 import Web3
from dotenv import load_dotenv

# Import SQLAlchemy session and models
from sqlalchemy.orm import Session
from database import SessionLocal
import models

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("EventListener")

# Environment configuration
WS_PROVIDER_URL = os.getenv("WS_PROVIDER_URL", "wss://your-websocket-provider-url")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS", "0xYourContractAddress")
# Path to the contract's ABI JSON file. Adjust the path relative to this file.
CONTRACT_ABI_PATH = os.getenv("CONTRACT_ABI_PATH", "../smart-contracts/build/contracts/MememonizeNFT.json")

# Load contract ABI
try:
    with open(CONTRACT_ABI_PATH) as abi_file:
        contract_json = json.load(abi_file)
        contract_abi = contract_json.get("abi")
        if not contract_abi:
            raise Exception("ABI not found in contract JSON.")
except Exception as e:
    logger.error(f"Error loading contract ABI: {e}")
    exit(1)

# Initialize Web3 connection
web3 = Web3(Web3.LegacyWebSocketProvider(WS_PROVIDER_URL))
if not web3.is_connected():
    logger.error("Could not connect to Web3 provider.")
    exit(1)
else:
    logger.info("Connected to Web3 provider.")

# Create contract instance
contract = web3.eth.contract(
    address=Web3.to_checksum_address(CONTRACT_ADDRESS),
    abi=contract_abi
)

def update_transaction_status(event):
    """
    Given a blockchain NFTPurchased event, update the corresponding transaction
    record in the database and update the asset record with the new owner address.
    """
    # Extract transaction hash from the event
    event_tx_hash = event.transactionHash.hex()
    # Normalize to always have a "0x" prefix
    if not event_tx_hash.startswith("0x"):
        event_tx_hash = "0x" + event_tx_hash
    
    # Extract additional event details if needed
    token_id = event['args'].get('tokenId')
    buyer = event['args'].get('buyer')
    seller = event['args'].get('seller')
    price = event['args'].get('price')
    
    logger.info(f"Processing NFTPurchased event for tx hash: {event_tx_hash}")
    logger.info(f"Token ID: {token_id}, Buyer: {buyer}, Seller: {seller}, Price: {price}")

    db: Session = SessionLocal()
    try:
        # Find a pending transaction with matching transaction_hash
        tx_record = db.query(models.Transaction).filter(
            models.Transaction.transaction_hash == event_tx_hash,
            models.Transaction.status == "pending"
        ).first()

        if tx_record:
            logger.info(f"Found pending transaction record (ID: {tx_record.id}). Marking as 'completed'.")
            tx_record.status = "completed"
            # Optionally update other fields (for example, tokenId, price, etc.)
        else:
            logger.warning(f"No matching pending transaction found for transaction hash: {event_tx_hash}")
            
        # Update asset record with new owner
        asset_record = db.query(models.Asset).filter(models.Asset.token_id == str(token_id)).first()
        if asset_record:
            logger.info(f"Updating asset (ID: {asset_record.id}) owner to buyer: {buyer} and marking as unavailable.")
            asset_record.owner_address = buyer
            asset_record.is_available = False
        else:
            logger.warning(f"No asset found for token ID: {token_id}")
            
        db.commit()
        logger.info("Database records updated successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating records: {e}")
    finally:
        db.close()

def listen_for_nft_purchased_events(poll_interval=5):
    """
    Listen for NFTPurchased events emitted by the smart contract and process them.
    """
    try:
        # Create an event filter for the NFTPurchased event starting from the latest block
        nft_purchased_filter = contract.events.NFTPurchased.create_filter(from_block='latest')
    except Exception as e:
        logger.error(f"Error creating NFTPurchased event filter: {e}")
        return

    logger.info("Started listening for NFTPurchased events...")
    while True:
        try:
            new_events = nft_purchased_filter.get_new_entries()
            for event in new_events:
                logger.info(f"New NFTPurchased event: {event}")
                update_transaction_status(event)
        except Exception as e:
            logger.error(f"Error processing events: {e}")
        
        time.sleep(poll_interval)

if __name__ == "__main__":
    try:
        listen_for_nft_purchased_events()
    except KeyboardInterrupt:
        logger.info("Event listener shutdown requested. Exiting...")

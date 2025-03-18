from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
import traceback
from routers.users import get_or_create_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Transaction])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        transactions = db.query(models.Transaction).offset(skip).limit(limit).all()
        return transactions
    except Exception as e:
        print(f"Error in get_transactions: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{transaction_id}", response_model=schemas.Transaction)
def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    try:
        transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
        if transaction is None:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return transaction
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_transaction: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/user/{user_id}", response_model=List[schemas.Transaction])
def get_user_transactions(user_id: int, db: Session = Depends(get_db)):
    try:
        transactions = db.query(models.Transaction).filter(
            (models.Transaction.buyer_id == user_id) | (models.Transaction.seller_id == user_id)
        ).all()
        return transactions
    except Exception as e:
        print(f"Error in get_user_transactions: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=schemas.Transaction, status_code=status.HTTP_201_CREATED)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    try:
        # Log the incoming transaction data
        print(f"Creating transaction with data: {transaction.dict()}")
        
        # Check if asset exists
        asset = db.query(models.Asset).filter(models.Asset.id == transaction.asset_id).first()
        if asset is None:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Get or create buyer and seller users if IDs are not provided
        if not transaction.buyer_id or not transaction.seller_id:
            # If buyer_id is not provided but buyer_address is
            if hasattr(transaction, 'buyer_address') and transaction.buyer_address:
                buyer = get_or_create_user(transaction.buyer_address, db)
                transaction.buyer_id = buyer.id
            else:
                # Create a default buyer if none provided
                buyer = get_or_create_user("0x0000000000000000000000000000000000000001", db)
                transaction.buyer_id = buyer.id
            
            # If seller_id is not provided but we have the asset owner
            if asset.owner_address:
                seller = get_or_create_user(asset.owner_address, db)
                transaction.seller_id = seller.id
            else:
                # Create a default seller if none provided
                seller = get_or_create_user("0x0000000000000000000000000000000000000002", db)
                transaction.seller_id = seller.id
        
        # Create transaction
        transaction_dict = transaction.dict()
        # Remove any extra fields that aren't in the model
        if 'buyer_address' in transaction_dict:
            transaction_dict.pop('buyer_address')
        if 'seller_address' in transaction_dict:
            transaction_dict.pop('seller_address')
            
        db_transaction = models.Transaction(**transaction_dict)
        db.add(db_transaction)
        
        # Update asset availability if needed
        if transaction.status != "cancelled":
            asset.is_available = False
        
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in create_transaction: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{transaction_id}/status", response_model=schemas.Transaction)
def update_transaction_status(transaction_id: int, status: str, db: Session = Depends(get_db)):
    try:
        transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
        if transaction is None:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        if status not in ["pending", "completed", "cancelled"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        # Update transaction status
        transaction.status = status
        
        # Handle asset ownership transfer if transaction is completed
        if status == "completed":
            asset = db.query(models.Asset).filter(models.Asset.id == transaction.asset_id).first()
            if asset:
                # Get buyer's wallet address
                buyer = db.query(models.User).filter(models.User.id == transaction.buyer_id).first()
                if buyer:
                    # Transfer ownership to buyer
                    asset.owner_address = buyer.wallet_address
                    # Make asset available again (now owned by the buyer)
                    asset.is_available = True
                    print(f"Asset {asset.id} ownership transferred to {buyer.wallet_address}")
        
        # If cancelled, make asset available again
        elif status == "cancelled":
            asset = db.query(models.Asset).filter(models.Asset.id == transaction.asset_id).first()
            if asset:
                asset.is_available = True
        
        db.commit()
        db.refresh(transaction)
        return transaction
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in update_transaction_status: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


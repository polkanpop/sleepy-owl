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
        
        # Require buyer address from the request
        if not hasattr(transaction, 'buyer_address') or not transaction.buyer_address:
            raise HTTPException(status_code=400, detail="buyer_address is required")
        
        # Get or create buyer using provided buyer_address
        buyer = get_or_create_user(transaction.buyer_address, db)
        transaction.buyer_id = buyer.id

        # Use asset.owner_address as seller address; if missing, throw error.
        if asset.owner_address:
            seller = get_or_create_user(asset.owner_address, db)
            transaction.seller_id = seller.id
        else:
            raise HTTPException(status_code=400, detail="Asset owner address is missing; cannot determine seller")
        
        # Exclude any provided 'status', 'buyer_address', and 'seller_address'
        # and set the status to "pending" to await on-chain confirmation.
        transaction_dict = transaction.dict(exclude={"status", "buyer_address", "seller_address"})
        transaction_dict["status"] = "pending"
            
        db_transaction = models.Transaction(**transaction_dict)
        db.add(db_transaction)
        
        # Mark asset as sold (not available) as purchase initiation (final confirmation will be handled via blockchain event)
        asset.is_available = False
        
        db.commit()
        db.refresh(db_transaction)
        return db_transaction
    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Error in create_transaction: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



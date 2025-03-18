from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
import traceback

router = APIRouter()

@router.get("/", response_model=List[schemas.User])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        users = db.query(models.User).offset(skip).limit(limit).all()
        return users
    except Exception as e:
        print(f"Error in get_users: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{user_id}", response_model=schemas.User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.id == user_id).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/wallet/{wallet_address}", response_model=schemas.User)
def get_user_by_wallet(wallet_address: str, db: Session = Depends(get_db)):
    try:
        user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
        if user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_user_by_wallet: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        # Check if user with this wallet address already exists
        existing_user = db.query(models.User).filter(models.User.wallet_address == user.wallet_address).first()
        if existing_user:
            return existing_user
        
        # Create new user
        db_user = models.User(**user.dict())
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        print(f"Error in create_user: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/{user_id}", response_model=schemas.User)
def update_user(user_id: int, user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        for key, value in user.dict().items():
            setattr(db_user, key, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in update_user: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.User).filter(models.User.id == user_id).first()
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        db.delete(db_user)
        db.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in delete_user: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Utility function to ensure a user exists
def get_or_create_user(wallet_address: str, db: Session):
    """Get a user by wallet address or create if not exists"""
    try:
        # Try to find existing user
        user = db.query(models.User).filter(models.User.wallet_address == wallet_address).first()
        
        # If user doesn't exist, create a new one
        if not user:
            user = models.User(
                wallet_address=wallet_address,
                username=f"User_{wallet_address[:8]}"  # Create a default username
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user
    except Exception as e:
        db.rollback()
        print(f"Error in get_or_create_user: {str(e)}")
        print(traceback.format_exc())
        raise Exception(f"Failed to get or create user: {str(e)}")


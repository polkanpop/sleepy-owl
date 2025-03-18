from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Asset schemas
class AssetBase(BaseModel):
  name: str
  description: Optional[str] = None
  price: float
  image_url: Optional[str] = None
  category: Optional[str] = None
  token_id: Optional[str] = None
  owner_address: Optional[str] = None
  is_available: bool = True

class AssetCreate(AssetBase):
  pass

class Asset(AssetBase):
  id: int
  created_at: datetime
  updated_at: datetime

  class Config:
      orm_mode = True

# User schemas
class UserBase(BaseModel):
  wallet_address: str
  username: Optional[str] = None
  email: Optional[str] = None

class UserCreate(UserBase):
  pass

class User(UserBase):
  id: int
  created_at: datetime

  class Config:
      orm_mode = True

# Transaction schemas
class TransactionBase(BaseModel):
  asset_id: int
  buyer_id: Optional[int] = None
  seller_id: Optional[int] = None
  price: float
  transaction_hash: Optional[str] = None
  status: str = "pending"
  buyer_address: Optional[str] = None  # Added buyer_address field
  seller_address: Optional[str] = None  # Added seller_address field

class TransactionCreate(TransactionBase):
  pass

class Transaction(TransactionBase):
  id: int
  created_at: datetime
  updated_at: datetime
  asset: Asset
  buyer: User
  seller: User

  class Config:
      orm_mode = True

# Search schemas
class SearchQuery(BaseModel):
  query: str
  category: Optional[str] = None


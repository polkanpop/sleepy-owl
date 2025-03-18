from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models
import schemas
from database import get_db
from sqlalchemy import or_

router = APIRouter()

@router.get("/", response_model=List[schemas.Asset])
def search_assets(
    query: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    search_query = db.query(models.Asset).filter(models.Asset.is_available == True)
    
    # Apply text search if query provided
    if query:
        search_query = search_query.filter(
            or_(
                models.Asset.name.ilike(f"%{query}%"),
                models.Asset.description.ilike(f"%{query}%")
            )
        )
    
    # Apply category filter if provided
    if category:
        search_query = search_query.filter(models.Asset.category == category)
    
    # Apply price range filters if provided
    if min_price is not None:
        search_query = search_query.filter(models.Asset.price >= min_price)
    if max_price is not None:
        search_query = search_query.filter(models.Asset.price <= max_price)
    
    return search_query.all()

@router.get("/categories", response_model=List[str])
def get_categories(db: Session = Depends(get_db)):
    # Get distinct categories from assets
    categories = db.query(models.Asset.category).distinct().all()
    return [category[0] for category in categories if category[0]]


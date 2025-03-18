from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uvicorn
import traceback
import sys

from database import get_db, engine, Base
import models
import schemas
from routers import assets, transactions, search, contract, users

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mememonize Trading API")

# Configure CORS - Updated to be more permissive
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite's default port
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Explicitly allow all methods
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(contract.router, prefix="/api/contract-address", tags=["contract"])
app.include_router(users.router, prefix="/api/users", tags=["users"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Mememonize Trading API"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/debug")
def debug_info():
    """Endpoint for debugging purposes"""
    try:
        # Get Python version
        python_version = sys.version
        
        # Test database connection
        db_status = "Unknown"
        try:
            db = next(get_db())
            # Try a simple query
            db.execute("SELECT 1")
            db_status = "Connected"
        except Exception as e:
            db_status = f"Error: {str(e)}"
        
        return {
            "python_version": python_version,
            "database_status": db_status,
            "api_status": "Running"
        }
    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# Add error handling middleware
@app.middleware("http")
async def add_error_handling(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        # Log the error
        print(f"Error processing request: {str(e)}")
        print(traceback.format_exc())
        
        # Return a 500 response
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": str(e)}
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


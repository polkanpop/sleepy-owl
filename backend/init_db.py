#!/usr/bin/env python3
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from database import Base
import models
import os
from dotenv import load_dotenv
import sys

def init_db():
    """
    Initialize the database by creating the schema (tables) without adding any sample data.
    """
    print("Initializing database...")
    
    # Load environment variables
    load_dotenv()
    
    # Get database URL from environment
    DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/SleepyOwl")
    
    try:
        # Extract database name from URL
        db_name = DATABASE_URL.split("/")[-1]
        
        # Create database if it doesn't exist
        # First connect without specifying the database
        engine_url = DATABASE_URL.rsplit("/", 1)[0]
        print(f"Connecting to database server at {engine_url}...")
        temp_engine = create_engine(engine_url)
        
        # Create database if it doesn't exist
        with temp_engine.connect() as conn:
            print(f"Creating database '{db_name}' if it doesn't exist...")
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
            print(f"Database '{db_name}' created or already exists")
        
        # Now connect to the specific database
        print(f"Connecting to database '{db_name}'...")
        engine = create_engine(DATABASE_URL)
        
        # Check if tables already exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if existing_tables:
            print(f"Found existing tables: {', '.join(existing_tables)}")
            create_tables = input("Tables already exist. Do you want to recreate them? (y/N): ").lower() == 'y'
        else:
            create_tables = True
        
        if create_tables:
            # Create tables based on the models
            print("Creating tables...")
            Base.metadata.create_all(bind=engine)
            print("Tables created successfully")
        else:
            print("Skipping table creation")
        
        print("Database initialization completed")
        return True
    except Exception as e:
        print(f"Error initializing database: {e}")
        return False

if __name__ == "__main__":
    success = init_db()
    if not success:
        sys.exit(1)


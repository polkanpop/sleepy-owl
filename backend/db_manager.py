#!/usr/bin/env python3
import os
import argparse
import subprocess
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from database import Base
import models

def load_db_config():
    """Load database configuration from .env file"""
    load_dotenv()
    
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URL", "mysql+pymysql://root:password@localhost/SleepyOwl")
    
    # Parse the database URL
    # Format: mysql+pymysql://username:password@host/database
    try:
        # Split the URL into components
        if '+' in db_url:
            driver_part, rest = db_url.split('+', 1)
            protocol, rest = rest.split('://', 1)
            driver = f"{driver_part}+{protocol}"
        else:
            driver = db_url.split('://', 1)[0]
            rest = db_url.split('://', 1)[1]
        
        auth_host, database = rest.rsplit('/', 1)
        
        if '@' in auth_host:
            auth, host = auth_host.split('@', 1)
            if ':' in auth:
                username, password = auth.split(':', 1)
            else:
                username = auth
                password = ""
        else:
            host = auth_host
            username = "root"
            password = ""
        
        # Handle port if specified
        if ':' in host:
            host, port = host.split(':', 1)
        else:
            port = "3306"  # Default MySQL port
        
        return {
            "driver": driver,
            "host": host,
            "port": port,
            "username": username,
            "password": password,
            "database": database,
            "url": db_url
        }
    except Exception as e:
        print(f"Error parsing database URL: {e}")
        print(f"URL format should be: mysql+pymysql://username:password@host:port/database")
        return None

def create_database(config):
    """Create the database if it doesn't exist"""
    if not config:
        return False
    
    # Create connection URL without the database name
    if '+' in config["driver"]:
        driver_part, protocol = config["driver"].split('+', 1)
        base_url = f"{driver_part}+{protocol}://{config['username']}:{config['password']}@{config['host']}:{config['port']}"
    else:
        base_url = f"{config['driver']}://{config['username']}:{config['password']}@{config['host']}:{config['port']}"
    
    try:
        # Connect to the server without specifying a database
        engine = create_engine(base_url)
        with engine.connect() as conn:
            # Check if database exists
            result = conn.execute(text(f"SHOW DATABASES LIKE '{config['database']}'"))
            if result.rowcount == 0:
                # Create database
                conn.execute(text(f"CREATE DATABASE `{config['database']}`"))
                print(f"Database '{config['database']}' created successfully")
            else:
                print(f"Database '{config['database']}' already exists")
        return True
    except SQLAlchemyError as e:
        print(f"Error creating database: {e}")
        return False

def create_tables(config, force=False):
    """Create database tables based on SQLAlchemy models"""
    if not config:
        return False
    
    try:
        # Connect to the database
        engine = create_engine(config["url"])
        
        # Check if tables already exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if existing_tables and not force:
            print(f"Found existing tables: {', '.join(existing_tables)}")
            print("Use --force to recreate tables")
            return False
        
        # Create tables
        print("Creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully")
        return True
    except SQLAlchemyError as e:
        print(f"Error creating tables: {e}")
        return False

def drop_tables(config, confirm=False):
    """Drop all database tables"""
    if not config:
        return False
    
    try:
        # Connect to the database
        engine = create_engine(config["url"])
        
        # Check if tables exist
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()
        
        if not existing_tables:
            print("No tables found in the database")
            return True
        
        # Confirm before dropping tables
        if not confirm:
            print(f"The following tables will be dropped: {', '.join(existing_tables)}")
            confirmation = input("Are you sure you want to drop all tables? This cannot be undone. (y/N): ").lower()
            if confirmation != 'y':
                print("Operation cancelled")
                return False
        
        # Drop tables
        print("Dropping tables...")
        Base.metadata.drop_all(bind=engine)
        print("Tables dropped successfully")
        return True
    except SQLAlchemyError as e:
        print(f"Error dropping tables: {e}")
        return False

def export_schema(config, output_file=None):
    """Export database schema to a SQL file"""
    if not config:
        return False
    
    if not output_file:
        output_file = f"{config['database']}_schema.sql"
    
    try:
        # Build mysqldump command for schema only
        cmd = ["mysqldump", "--no-data"]
        
        # Add credentials
        cmd.extend(["-h", config["host"]])
        cmd.extend(["-P", config["port"]])
        cmd.extend(["-u", config["username"]])
        
        if config["password"]:
            cmd.extend([f"-p{config['password']}"])
        
        # Add database name
        cmd.append(config["database"])
        
        # Redirect output to file
        with open(output_file, "w") as f:
            subprocess.run(cmd, stdout=f, check=True)
        
        print(f"Schema exported successfully to {output_file}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error exporting schema: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Mememonize Database Manager")
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Init command
    init_parser = subparsers.add_parser("init", help="Initialize database and tables")
    init_parser.add_argument("--force", action="store_true", help="Force recreation of tables if they exist")
    
    # Create tables command
    create_parser = subparsers.add_parser("create-tables", help="Create database tables")
    create_parser.add_argument("--force", action="store_true", help="Force recreation of tables if they exist")
    
    # Drop tables command
    drop_parser = subparsers.add_parser("drop-tables", help="Drop all database tables")
    drop_parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt")
    
    # Export schema command
    export_parser = subparsers.add_parser("export-schema", help="Export database schema to a SQL file")
    export_parser.add_argument("--output", "-o", help="Output file path")
    
    args = parser.parse_args()
    
    # Load database configuration
    config = load_db_config()
    if not config:
        return False
    
    # Execute command
    if args.command == "init":
        if not create_database(config):
            return False
        return create_tables(config, args.force)
    elif args.command == "create-tables":
        return create_tables(config, args.force)
    elif args.command == "drop-tables":
        return drop_tables(config, args.yes)
    elif args.command == "export-schema":
        return export_schema(config, args.output)
    else:
        parser.print_help()
        return True

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)


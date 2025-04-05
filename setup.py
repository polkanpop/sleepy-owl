#!/usr/bin/env python3
import os
import subprocess
import sys
import platform
from pathlib import Path

def run_command(command, cwd=None):
    """Run a command and print its output in real-time."""
    print(f"\n> {command}")
    
    # Always use shell=True to handle paths with spaces properly
    process = subprocess.Popen(
        command,
        shell=True,
        cwd=cwd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # Print output in real-time
    for line in iter(process.stdout.readline, ''):
        print(line.rstrip())
    
    # Wait for process to complete
    process.wait()
    
    # Return success/failure
    return process.returncode == 0

def setup_frontend():
    """Set up the frontend."""
    print("\n=== Setting up Frontend ===")
    
    # Get the current directory
    current_dir = os.getcwd()
    frontend_dir = os.path.join(current_dir, "frontend")
    
    # Install dependencies
    print("Installing frontend dependencies...")
    if not run_command("npm install", cwd=frontend_dir):
        print("❌ Failed to install frontend dependencies")
        return False
    
    print("✅ Frontend setup completed")
    return True

def setup_smart_contracts():
    """Set up the smart contracts."""
    print("\n=== Setting up Smart Contracts ===")
    
    # Get the current directory
    current_dir = os.getcwd()
    contracts_dir = os.path.join(current_dir, "smart-contracts")
    
    # Install dependencies
    print("Installing smart contract dependencies...")
    if not run_command("npm install", cwd=contracts_dir):
        print("❌ Failed to install smart contract dependencies")
        return False
    
    print("✅ Smart contracts setup completed")
    return True

def main():
    """Set up the entire project."""
    print("Setting up Sleepy Owl Trading Platform...")
    
    # Setup components
    frontend_ok = setup_frontend()
    contracts_ok = setup_smart_contracts()
    
    if frontend_ok and contracts_ok:
        print("\n=== Setup Complete ===")
        print("""
Next steps:
1. Configure your database in backend/.env
2. Initialize the database (in anaconda environment): 
    - python init_db.py
3. Start Ganache UI:
    - Start the Ganache UI 
    - New workspace and import the truffle.config file in /smart-contracts
4. Deploy smart contracts: 
    - cd smart-contracts && truffle migrate
5. Start backend (after activating anaconda virtual environment): 
    - uvicorn main:app --reload
6. Start frontend: 
    - cd frontend && npm run dev
""")
        return True
    else:
        print("\n❌ Setup failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    if success:
        sys.exit(0)
    else:
        sys.exit(1)


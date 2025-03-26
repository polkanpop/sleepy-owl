# Mememonize Trading Platform
A decentralized trading system for digital assets.

## Prerequisites

- Node.js 
- Python 
- MySQL
- Ganache (for local blockchain)
- Anaconda
## Backend dependencies
- Anaconda (Manage packages and environments)
- FastAPI
- Uvicorn
- SQLAlchemy
- pymysql

Using Anaconda, please install the dependencies to your anaconda virtual environment.

### Anaconda Setup

You can import the "mememonize-env.yaml" environment to anaconda and 
activate the virtual environment. The .yaml file already has all the dependencies installed.

### Run the setup script

```python setup.py```

### Database setup

Then edit your the backend/.env to your MySQL credentials
```DATABASE_URL=mysql+pymysql://root:password@localhost/mememonize```

```root```: Your username   
```password```: Your password

Make sure that your MySQL service is running and you are in the "mememonize-env" anaconda virtual environment

```cd backend ```
```python init_db.py```

### Start Ganache UI:
Start the Ganache UI 
New workspace and import the truffle.config file in /smart-contracts
### Deploy smart contracts: 
```cd smart-contracts && truffle migrate```
    - Change the "CONTRACT_ADDRESS" variable in .env to the contract address after truffle migrate.
### Start backend (after activating anaconda virtual environment): 
```python event_listener.py```
```uvicorn main:app --reload```
### Start frontend: 
```cd frontend && npm run dev```

### Connect local blockchain to MetaMask

#### Install the Meta Mask extension on your browser and add an account.

When first starting Meta Mask it will ask you to add an account, click on import and
import the 12 mnemonic on the Ganache blockchain.  
  
  
Then  
  
  
Add a custom network
- Network name: Ganache
- Default RPC URL: RPC URL in Ganache UI
- Chain ID: 1337
- Currency symbol: ETH

Select that network
Add two or more accounts to Meta Mask
- Import account
- Copy the private key of one of the accounts in the local blockchain on Ganache
- Paste it
- If it ask to connect to localhost:5173, accept the connection.


Everything should work according to the video Demo now.


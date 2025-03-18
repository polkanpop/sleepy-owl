# Mememonize Trading Platform
A decentralized trading system for digital assets.

## Prerequisites

- Node.js 
- Python 
- MySQL
- Ganache (for local blockchain)
- Anaconda
## Setup

### Anaconda Setup

import the "mememonize-env.yaml" environment to anaconda and 
activate the virtual environment.

### Run the setup script

```python setup.py```

### Database setup

Make sure that your MySQL service is running and you are in the "mememonize-env" anaconda virtual environment

```cd backend ```
```python init_db.py```

Then edit your the backend/.env to your MySQL credentials
```DATABASE_URL=mysql+pymysql://root:password@localhost/mememonize```

```root```: Your username
```password```: Your password

### Start Ganache UI:
Start the Ganache UI 
New workspace and import the truffle.config file in /smart-contracts
### Deploy smart contracts: 
```cd smart-contracts && truffle migrate```
    - Change the "CONTRACT_ADDRESS" variable in .env to the contract address after truffle migrate.
### Start backend (after activating anaconda virtual environment): 
```uvicorn main:app --reload```
### Start frontend: 
```cd frontend && npm run dev```

### Connect local blockchain to MetaMask

#### Install the Meta Mask extension on your browser and make an account.
Add a custom network
    - Network name: Ganache
    - Default RPC URL: RPC URL in Ganache UI
    - Chain ID: 1337
    - Currency symbol: ETH

Select that network
Add account 
    - Import account
    - Copy the private key of one of the accounts in the local blockchain on Ganache
    - Paste it
    - If it ask to connect to localhost:5173, accept the connection.


Everything should work according to the video Demo now.


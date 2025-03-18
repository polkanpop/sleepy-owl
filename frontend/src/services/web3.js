import Web3 from "web3"
import MememonizeEscrowABI from "../contracts/MememonizeEscrow.json"

let web3
let escrowContract

// Initialize Web3
export const initWeb3 = async () => {
  if (window.ethereum) {
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" })
      web3 = new Web3(window.ethereum)

      // Get the network ID
      const networkId = await web3.eth.net.getId()

      // Try to get contract address from backend first
      try {
        const response = await fetch("/api/contract-address")
        const data = await response.json()

        if (data.address) {
          escrowContract = new web3.eth.Contract(MememonizeEscrowABI.abi, data.address)
          return { web3, escrowContract }
        }
      } catch (error) {
        console.warn("Could not fetch contract address from backend, falling back to local ABI")
      }

      // Fallback to ABI networks if backend fails
      const deployedNetwork = MememonizeEscrowABI.networks[networkId]

      if (deployedNetwork) {
        escrowContract = new web3.eth.Contract(MememonizeEscrowABI.abi, deployedNetwork.address)

        return { web3, escrowContract }
      } else {
        console.error("Contract not deployed on the current network")
        return { web3, escrowContract: null }
      }
    } catch (error) {
      console.error("User denied account access", error)
      return { web3: null, escrowContract: null }
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    web3 = new Web3(window.web3.currentProvider)
    return { web3, escrowContract: null }
  } else {
    // Fallback to local provider
    const provider = new Web3.providers.HttpProvider("http://localhost:8545")
    web3 = new Web3(provider)
    return { web3, escrowContract: null }
  }
}

// Get current account
export const getCurrentAccount = async () => {
  if (!web3) await initWeb3()
  const accounts = await web3.eth.getAccounts()
  return accounts[0]
}

// List an asset
export const listAsset = async (name, price) => {
  if (!escrowContract) await initWeb3()
  const account = await getCurrentAccount()

  const priceWei = web3.utils.toWei(price.toString(), "ether")

  return escrowContract.methods.listAsset(name, priceWei).send({ from: account })
}

// Purchase an asset
export const purchaseAsset = async (assetId, price) => {
  if (!escrowContract) await initWeb3()
  const account = await getCurrentAccount()

  const priceWei = web3.utils.toWei(price.toString(), "ether")

  return escrowContract.methods.purchaseAsset(assetId).send({ from: account, value: priceWei })
}
const listenForTransactionCompletion = (transactionHash) => {
  escrowContract.events.TransactionCompleted({ filter: { transactionHash } }, (error, event) => {
    if (error) {
      console.error("Error listening for transaction completion:", error);
    } else {
      console.log("Transaction completed event:", event);
    }
  });
};

// Helper function to derive transaction ID from hash using blockchain events
const deriveTransactionIdFromHash = async (hash) => {
  try {
    // Query past events to find the transaction ID associated with this hash
    const events = await escrowContract.getPastEvents('AssetPurchased', {
      fromBlock: 0,
      toBlock: 'latest'
    });
    
    // Find the event that matches our transaction hash
    // This is a simplified approach - in production, you'd need more robust logic
    const matchingEvent = events.find(event => event.transactionHash === hash);
    
    if (matchingEvent && matchingEvent.returnValues.transactionId) {
      return matchingEvent.returnValues.transactionId;
    }
    
    throw new Error("Could not find transaction ID from hash using AssetPurchased event");
  } catch (error) {
    console.error("Error deriving transaction ID from hash:", error);
    throw new Error("Failed to derive transaction ID: " + error.message);
  }
};
// Complete a transaction
export const completeTransaction = async (transactionId) => {
  if (!escrowContract) await initWeb3();
  const account = await getCurrentAccount();

  try {
    // If transactionId is a transaction hash, we need to get the actual transaction ID
    if (transactionId && transactionId.startsWith("0x")) {
      console.log("Transaction hash provided. Listening for completion...");
      listenForTransactionCompletion(transactionId);
      
      // Derive the actual transaction ID from blockchain events
      transactionId = await deriveTransactionIdFromHash(transactionId);
      console.log("Derived transaction ID:", transactionId);
    }

    if (!transactionId) {
      throw new Error("Valid transaction ID is required to complete the transaction.");
    }

    console.log("Completing transaction with ID:", transactionId);
    return escrowContract.methods.completeTransaction(transactionId).send({ from: account });
  } catch (error) {
    console.error("Error during completion of transaction:", error);
    throw new Error("MetaMask RPC transaction failure: " + error.message);
  }
}

// Cancel a transaction
export const cancelTransaction = async (transactionId) => {
  if (!escrowContract) await initWeb3()
  const account = await getCurrentAccount()

  try {
    // If transactionId is a transaction hash, derive the actual ID
    if (transactionId && transactionId.startsWith("0x")) {
      transactionId = await deriveTransactionIdFromHash(transactionId);
      console.log("Derived transaction ID for cancellation:", transactionId);
    }

    if (!transactionId) {
      throw new Error("Valid transaction ID is required to cancel the transaction.");
    }

    return escrowContract.methods.cancelTransaction(transactionId).send({ from: account });
  } catch (error) {
    console.error("Error during cancellation of transaction:", error);
    throw new Error("MetaMask RPC transaction failure: " + error.message);
  }
} 
export default {
  initWeb3,
  getCurrentAccount,
  listAsset,
  purchaseAsset,
  completeTransaction,
  cancelTransaction,
}


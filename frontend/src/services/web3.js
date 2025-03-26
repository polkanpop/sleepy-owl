import Web3 from "web3"
import MememonizeNFTABI from "../contracts/MememonizeNFT.json"

let web3
let nftContract

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
          nftContract = new web3.eth.Contract(MememonizeNFTABI.abi, data.address)
          return { web3, nftContract }
        }
      } catch (error) {
        console.warn("Could not fetch contract address from backend, falling back to local ABI")
      }

      // Fallback to ABI networks if backend fails
      const deployedNetwork = MememonizeNFTABI.networks[networkId]

      if (deployedNetwork) {
        nftContract = new web3.eth.Contract(MememonizeNFTABI.abi, deployedNetwork.address)

        return { web3, nftContract }
      } else {
        console.error("Contract not deployed on the current network")
        return { web3, nftContract: null }
      }
    } catch (error) {
      console.error("User denied account access", error)
      return { web3: null, nftContract: null }
    }
  } else if (window.web3) {
    // Legacy dapp browsers
    web3 = new Web3(window.web3.currentProvider)
    return { web3, nftContract: null }
  } else {
    // Fallback to local provider
    const provider = new Web3.providers.HttpProvider("http://localhost:7545")
    web3 = new Web3(provider)
    return { web3, nftContract: null }
  }
}

// Get current account
export const getCurrentAccount = async () => {
  if (!web3) await initWeb3()
  const accounts = await web3.eth.getAccounts()
  return accounts[0]
}

// Mint an NFT to a recipient with a given tokenURI and sale price (in wei)
export const mintNFT = async (recipient, tokenURI, price) => {
  if (!nftContract) await initWeb3();
  const account = await getCurrentAccount();

  try {
    // Send transaction to mint NFT with the provided sale price
    const receipt = await nftContract.methods.mintNFT(recipient, tokenURI, price).send({ from: account });
    console.log("Mint NFT transaction receipt:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error minting NFT:", error);
    throw error;
  }
};

// Retrieve the token URI for a given token ID
export const getTokenURI = async (tokenId) => {
  if (!nftContract) await initWeb3();
  try {
    const uri = await nftContract.methods.tokenURI(tokenId).call();
    console.log(`Token URI for token ${tokenId}:`, uri);
    return uri;
  } catch (error) {
    console.error("Error fetching token URI:", error);
    throw error;
  }
};

// Get the owner of a specific token
export const getTokenOwner = async (tokenId) => {
  if (!nftContract) await initWeb3();
  try {
    const owner = await nftContract.methods.ownerOf(tokenId).call();
    return owner;
  } catch (error) {
    console.error("Error fetching token owner:", error);
    throw error;
  }
};

// Get the total supply of tokens
export const getTotalSupply = async () => {
  if (!nftContract) await initWeb3();
  try {
    const totalSupply = await nftContract.methods.totalSupply().call();
    return totalSupply;
  } catch (error) {
    console.error("Error fetching total supply:", error);
    throw error;
  }
};

// Get all tokens owned by an address
export const getTokensOfOwner = async (ownerAddress) => {
  if (!nftContract) await initWeb3();
  try {
    const balance = await nftContract.methods.balanceOf(ownerAddress).call();
    const tokens = [];
    
    for (let i = 0; i < balance; i++) {
      const tokenId = await nftContract.methods.tokenOfOwnerByIndex(ownerAddress, i).call();
      tokens.push(tokenId);
    }
    
    return tokens;
  } catch (error) {
    console.error("Error fetching tokens of owner:", error);
    throw error;
  }
};

// Transfer an NFT from one owner to another
export const transferNFT = async (from, to, tokenId) => {
  if (!nftContract) await initWeb3();
  const account = await getCurrentAccount();
  try {
    // Call safeTransferFrom method from ERC721 standard
    const receipt = await nftContract.methods.safeTransferFrom(from, to, tokenId)
      .send({ from: account });
    console.log("Transfer NFT receipt:", receipt);
    return receipt;
  } catch (error) {
    console.error("Error transferring NFT:", error);
    throw error;
  }
};

// Purchase an NFT by calling the appropriate function on the contract.
// This function will try the "purchaseNFT" method first, and if that's not available,
// it will attempt "purchaseAsset". The buyer sends the salePrice in wei along with the transaction.
export const purchaseAsset = async (tokenId, salePrice) => {
  if (!nftContract) await initWeb3();
  const buyer = await getCurrentAccount();
  
  // Determine which method name is available on the contract
  let methodName = null;
  if (typeof nftContract.methods.purchaseNFT === "function") {
    methodName = "purchaseNFT";
  } else if (typeof nftContract.methods.purchaseAsset === "function") {
    methodName = "purchaseAsset";
  } else {
    throw new Error("Neither purchaseNFT nor purchaseAsset methods are available on the contract instance");
  }
  
  try {
    console.log(`Calling contract method ${methodName} with tokenId: ${tokenId} and value: ${salePrice}`);
    
    // Create method object for reuse
    const method = nftContract.methods[methodName](tokenId);
    
    // Estimate gas for the call
    let gasEstimate;
    try {
      gasEstimate = await method.estimateGas({ from: buyer, value: salePrice });
      console.log(`Gas estimate for method ${methodName} on token ${tokenId}: ${gasEstimate}`);
      // Add a 10% buffer to gas estimate
      const gasWithBuffer = Math.ceil(gasEstimate * 1.1);
      const receipt = await method.send({ from: buyer, value: salePrice, gas: gasWithBuffer });
      console.log("Purchase asset receipt:", receipt);
      return receipt;
    } catch (gasError) {
      console.error("Gas estimation failed:", gasError);
      if (gasError.message && gasError.message.includes("execution reverted")) {
        throw new Error(`Transaction would fail (reverted): ${gasError.message}`);
      }
      console.warn("Attempting transaction without manual gas estimation");
      const receipt = await method.send({ from: buyer, value: salePrice });
      console.log("Purchase asset receipt:", receipt);
      return receipt;
    }
  } catch (error) {
    console.error("Error purchasing asset:", error.message || error);
    if (error.code && error.message) {
      console.error(`JSON-RPC Error Code: ${error.code}`);
      console.error(`Error Details: ${JSON.stringify(error)}`);
    }
    throw error;
  }
};
export default {
  initWeb3,
  getCurrentAccount,
  mintNFT,
  getTokenURI,
  getTokenOwner,
  getTotalSupply,
  getTokensOfOwner,
  transferNFT,
  purchaseAsset,
  get web3() {
    // Expose the underlying web3 instance for utility methods (like toWei)
    return web3
  }
}


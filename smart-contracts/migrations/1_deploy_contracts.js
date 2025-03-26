const MememonizeNFT = artifacts.require("MememonizeNFT");
const fs = require('fs');
const path = require('path');

module.exports = async (deployer, network, accounts) => {
  // Deploy the contract
  await deployer.deploy(MememonizeNFT);
  
  // Get the deployed contract instance
  const nftInstance = await MememonizeNFT.deployed();
  
  console.log(`Contract deployed at address: ${nftInstance.address}`);
  
  // Update the contract address in the frontend
  try {
    // Get the contract JSON
    const contractJson = require('../build/contracts/MememonizeNFT.json');
    
    // Copy the contract JSON to the frontend
    const frontendContractsDir = path.resolve(__dirname, '../../frontend/src/contracts');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(frontendContractsDir)) {
      fs.mkdirSync(frontendContractsDir, { recursive: true });
    }
    
    // Write the contract JSON to the frontend
    fs.writeFileSync(
      path.resolve(frontendContractsDir, 'MememonizeNFT.json'),
      JSON.stringify(contractJson, null, 2)
    );
    
    console.log('Contract ABI and address updated in frontend');
  } catch (error) {
    console.error('Error updating contract address in frontend:', error);
  }
};


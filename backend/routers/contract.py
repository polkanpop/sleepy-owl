from fastapi import APIRouter, HTTPException
import os
import json
from pathlib import Path

router = APIRouter()

@router.get("/")
def get_contract_address():
    try:
        # Path to contract JSON file for MememonizeNFT
        contract_path = Path(__file__).parent.parent.parent / "smart-contracts" / "build" / "contracts" / "MememonizeNFT.json"
        
        if not contract_path.exists():
            raise HTTPException(status_code=404, detail="Contract file not found")
        
        with open(contract_path, 'r') as file:
            contract_json = json.load(file)
            
            networks = contract_json.get('networks', {})
            if not networks:
                raise HTTPException(status_code=404, detail="No networks found in contract file")
            
            # Use the first network key, typically corresponding to Ganache (e.g., 5777)
            network_id = list(networks.keys())[0]
            contract_address = networks[network_id].get('address')
            
            if not contract_address:
                raise HTTPException(status_code=404, detail="Contract address not found in the network data")
            
            return {"address": contract_address, "network_id": network_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import APIRouter, HTTPException
import os
import json
from pathlib import Path

router = APIRouter()

@router.get("/")
def get_contract_address():
    try:
        # Path to contract JSON file
        contract_path = Path(__file__).parent.parent.parent / "smart-contracts" / "build" / "contracts" / "MememonizeEscrow.json"
        
        if not contract_path.exists():
            return {"address": None, "error": "Contract file not found"}
        
        with open(contract_path, 'r') as file:
            contract_json = json.load(file)
            
            # Get the network ID (usually 5777 for Ganache)
            network_keys = list(contract_json.get('networks', {}).keys())
            
            if not network_keys:
                return {"address": None, "error": "No networks found in contract file"}
            
            network_id = network_keys[0]
            contract_address = contract_json['networks'][network_id]['address']
            
            return {"address": contract_address, "network_id": network_id}
    except Exception as e:
        return {"address": None, "error": str(e)}


"use client"

import { Link as RouterLink } from "react-router-dom"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Link,
  Button,
  CircularProgress,
} from "@mui/material"
import { useState } from "react"
import { transactionsApi } from "../services/api"
import web3Service from "../services/web3"

function getStatusColor(status) {
  switch (status.toLowerCase()) {
    case "completed":
      return "success"
    case "pending":
      return "warning"
    case "cancelled":
      return "error"
    default:
      return "default"
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString()
}


function TransactionTable({ transactions = [], onTransactionUpdate }) {
  const [processingId, setProcessingId] = useState(null);

  const handleCompleteTransaction = async (transaction) => {
    try {
      setProcessingId(transaction.id);

      // Confirm transaction completion on blockchain
      console.log("Starting blockchain transaction completion...");
      const blockchainTxId = transaction.transaction_hash ?? "1"; // Fallback ID if not present

      const blockchainResult = await web3Service.completeTransaction(blockchainTxId);
      console.log("Blockchain transaction completion result:", blockchainResult);

      if (blockchainResult && blockchainResult.status) {
        // Update the transaction status in the database
        console.log("Blockchain confirmed. Updating transaction status...");
        await transactionsApi.updateStatus(transaction.id, "completed");

        // Refresh the transaction list in the UI
        if (onTransactionUpdate) {
          onTransactionUpdate();
        }
      } else {
        console.error("Blockchain transaction not successful.");
      }
    } catch (error) {
      console.error("Error during transaction completion:", error);
      alert(`Transaction completion failed: ${error.message || "Unknown error"}`);
    } finally {
      setProcessingId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Typography variant="body1" sx={{ textAlign: "center", my: 4 }}>
        No transactions found.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="transaction table">
        <TableHead>
          <TableRow>
            <TableCell>Asset</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Buyer</TableCell>
            <TableCell>Seller</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <Link component={RouterLink} to={`/asset/${transaction.asset.id}`}>
                  {transaction.asset.name}
                </Link>
              </TableCell>
              <TableCell>{transaction.price} ETH</TableCell>
              <TableCell>
                {transaction.buyer.username || transaction.buyer.wallet_address.substring(0, 8) + "..."}
              </TableCell>
              <TableCell>
                {transaction.seller.username || transaction.seller.wallet_address.substring(0, 8) + "..."}
              </TableCell>
              <TableCell>{formatDate(transaction.created_at)}</TableCell>
              <TableCell>
                <Chip
                  label={transaction.status}
                  color={getStatusColor(transaction.status)}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {transaction.status === "pending" && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    disabled={processingId === transaction.id}
                    onClick={() => handleCompleteTransaction(transaction)}
                  >
                    {processingId === transaction.id ? <CircularProgress size={20} /> : "Complete"}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}



export default TransactionTable


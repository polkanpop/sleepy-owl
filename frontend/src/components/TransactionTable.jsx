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
  Link,
} from "@mui/material"

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString()
}


function TransactionTable({ transactions = [] }) {

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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}



export default TransactionTable


"use client"

import { useState, useEffect } from "react"
import { Container, Typography, Box, CircularProgress, Alert, Snackbar, Tabs, Tab } from "@mui/material"
import TransactionTable from "../components/TransactionTable"
import { transactionsApi } from "../services/api"
import web3Service from "../services/web3"

function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })
  const [web3Initialized, setWeb3Initialized] = useState(false)

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        await web3Service.initWeb3()
        setWeb3Initialized(true)
      } catch (err) {
        console.error("Error initializing web3:", err)
        setSnackbar({
          open: true,
          message: "Failed to connect to blockchain. Please make sure you have MetaMask installed.",
          severity: "error",
        })
      }
    }

    initWeb3()
  }, [])

  const fetchTransactions = async () => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, we would filter by the current user
      // For demo purposes, we'll fetch all transactions
      const response = await transactionsApi.getAll()
      setTransactions(response.data)
    } catch (err) {
      console.error("Error fetching transactions:", err)
      setError("Failed to load transaction history. Please try again later.")
      setSnackbar({
        open: true,
        message: "Failed to load transaction history. Please try again later.",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const handleTransactionUpdate = () => {
    // Refresh the transaction list
    fetchTransactions()

    // Show success message
    setSnackbar({
      open: true,
      message: "Transaction completed successfully!",
      severity: "success",
    })
  }

  // Filter transactions based on tab
  const filteredTransactions = transactions.filter((transaction) => {
    if (tabValue === 0) return true // All transactions
    if (tabValue === 1) return transaction.status === "completed"
    if (tabValue === 2) return transaction.status === "pending"
    if (tabValue === 3) return transaction.status === "cancelled"
    return true
  })

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Transaction History
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="transaction tabs">
          <Tab label="All" />
          <Tab label="Completed" />
          <Tab label="Pending" />
          <Tab label="Cancelled" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      ) : !web3Initialized ? (
        <Alert severity="warning" sx={{ my: 4 }}>
          Please connect to MetaMask to complete transactions.
        </Alert>
      ) : (
        <TransactionTable transactions={filteredTransactions} onTransactionUpdate={handleTransactionUpdate} />
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default TransactionHistory


"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material"
import AssetDetailCard from "../components/AssetDetailCard"
import { assetsApi, transactionsApi, usersApi } from "../services/api"
import web3 from "../services/web3" // Updated import to match actual file: web3.js

function AssetDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [asset, setAsset] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [purchaseDialog, setPurchaseDialog] = useState(false)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })
  const [web3Initialized, setWeb3Initialized] = useState(false)
  const [purchaseStep, setPurchaseStep] = useState(0)
  const [transactionHash, setTransactionHash] = useState(null)
  const [transactionId, setTransactionId] = useState(null)
  const [blockchainSuccess, setBlockchainSuccess] = useState(false)
  const [databaseSuccess, setDatabaseSuccess] = useState(false)

  const purchaseSteps = ["Initiate Purchase", "Confirm Blockchain Transaction", "Complete Purchase"]

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        await web3.initWeb3()
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

  useEffect(() => {
    const fetchAsset = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await assetsApi.getById(id)
        setAsset(response.data)
      } catch (err) {
        console.error("Error fetching asset:", err)
        setError("The asset could not be found.")
        setSnackbar({
          open: true,
          message: "The asset could not be found.",
          severity: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAsset()
  }, [id])

  const handlePurchase = (asset) => {
    if (!web3Initialized) {
      setSnackbar({
        open: true,
        message: "Please connect to MetaMask first.",
        severity: "warning",
      })
      return
    }
    setPurchaseDialog(true)
    setPurchaseStep(0)
    setBlockchainSuccess(false)
    setDatabaseSuccess(false)
  }

  const handleConfirmPurchase = async () => {
    setPurchaseLoading(true)
    setPurchaseStep(1)

    try {
      // First, interact with the blockchain
      const account = await web3.getCurrentAccount()

      // Convert the asset price (in ETH) to wei before sending the transaction
      const weiPrice = web3.web3.utils.toWei(asset.price.toString(), "ether")

      // Purchase the asset on the blockchain by calling purchaseAsset with tokenId and sale price
      const result = await web3.purchaseAsset(asset.token_id, weiPrice)

      setTransactionHash(result.transactionHash)

      // Extract the tokenId from the NFTPurchased event (Note: our event does not include a separate transactionId)
      const blockchainTransactionId =
        result.events?.NFTPurchased?.returnValues?.tokenId || asset.token_id
      setTransactionId(blockchainTransactionId)

      setBlockchainSuccess(true)
      setPurchaseStep(2)

      try {
        // First, ensure the buyer exists in the database
        try {
          // Try to get the user first
          await usersApi.getByWallet(account)
        } catch (userErr) {
          // If user doesn't exist, create one
          if (userErr.response && userErr.response.status === 404) {
            await usersApi.create({
              wallet_address: account,
              username: `User_${account.substring(0, 8)}`,
            })
          }
        }

        // Then, record the transaction in our database
        const response = await transactionsApi.create({
          asset_id: asset.id,
          buyer_address: account, // Include the buyer's wallet address
          price: asset.price,
          transaction_hash: result.transactionHash,
          status: "pending",
        })

        setDatabaseSuccess(true)

        // Update the asset availability
        try {
          await assetsApi.update(asset.id, {
            ...asset,
            is_available: false,
          })
        } catch (updateErr) {
          console.error("Error updating asset availability:", updateErr)
          // Continue anyway since the blockchain transaction was successful
        }

        setSnackbar({
          open: true,
          message: "Purchase initiated successfully! Transaction is pending.",
          severity: "success",
        })

        // Navigate to transactions page after successful purchase
        setTimeout(() => {
          setPurchaseDialog(false)
          navigate("/transactions")
        }, 3000)
      } catch (dbErr) {
        console.error("Error recording transaction in database:", dbErr)
        setSnackbar({
          open: true,
          message:
            "Blockchain transaction successful, but there was an error recording it in our database. The transaction is still valid.",
          severity: "warning",
        })

        // Still navigate to transactions after a delay
        setTimeout(() => {
          setPurchaseDialog(false)
          navigate("/transactions")
        }, 5000)
      }
    } catch (err) {
      console.error("Error purchasing asset:", err)
      setSnackbar({
        open: true,
        message: "Failed to purchase asset: " + (err.message || "Unknown error"),
        severity: "error",
      })
      setPurchaseStep(0)
    } finally {
      setPurchaseLoading(false)
    }
  }

  const handleCompleteTransaction = async () => {
    try {
      if (!transactionId) {
        throw new Error("Transaction ID not found")
      }

      // Complete the transaction on the blockchain
      const result = await web3.completeTransaction(transactionId)

      // Update the transaction status in the database
      try {
        await transactionsApi.updateStatus(transactionId, "completed")
      } catch (dbErr) {
        console.error("Error updating transaction status in database:", dbErr)
        // Continue anyway since the blockchain transaction was successful
      }

      setSnackbar({
        open: true,
        message: "Transaction completed successfully!",
        severity: "success",
      })

      // Close the dialog and navigate to transactions page
      setPurchaseDialog(false)
      navigate("/transactions")
    } catch (err) {
      console.error("Error completing transaction:", err)
      setSnackbar({
        open: true,
        message: "Failed to complete transaction: " + (err.message || "Unknown error"),
        severity: "error",
      })
    }
  }

  const handleCloseDialog = () => {
    // If blockchain transaction was successful but database recording failed,
    // warn the user before closing
    if (blockchainSuccess && !databaseSuccess) {
      setSnackbar({
        open: true,
        message:
          "Your purchase was recorded on the blockchain but not in our database. The transaction is still valid.",
        severity: "warning",
      })
    }
    setPurchaseDialog(false)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Container maxWidth="lg">
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      ) : (
        <Box>
          <AssetDetailCard asset={asset} onPurchase={handlePurchase} />
        </Box>
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog
        open={purchaseDialog}
        onClose={handleCloseDialog}
        aria-labelledby="purchase-dialog-title"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle id="purchase-dialog-title">Purchase Asset</DialogTitle>
        <DialogContent>
          <Stepper activeStep={purchaseStep} sx={{ mb: 4 }}>
            {purchaseSteps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {purchaseStep === 0 && (
            <>
              <DialogContentText>
                Are you sure you want to purchase {asset?.name} for {asset?.price} ETH? This will initiate a blockchain
                transaction.
              </DialogContentText>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Asset Details:
                </Typography>
                <Typography>Name: {asset?.name}</Typography>
                <Typography>Price: {asset?.price} ETH</Typography>
                <Typography>Category: {asset?.category}</Typography>
                <Typography>
                  Owner: {asset?.owner_address?.substring(0, 8)}...
                  {asset?.owner_address?.substring(asset?.owner_address.length - 6)}
                </Typography>
              </Box>
            </>
          )}

          {purchaseStep === 1 && (
            <Box sx={{ textAlign: "center", py: 2 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <DialogContentText>
                Processing your transaction on the blockchain. Please confirm the transaction in your wallet and wait
                for it to be mined.
              </DialogContentText>
            </Box>
          )}

          {purchaseStep === 2 && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                Transaction submitted successfully!
              </Alert>
              <DialogContentText>
                Your purchase has been initiated. The transaction has been submitted to the blockchain.
              </DialogContentText>
              {transactionHash && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2, wordBreak: "break-all" }}>
                  <Typography variant="subtitle2">Transaction Hash:</Typography>
                  <Typography variant="body2">{transactionHash}</Typography>
                </Paper>
              )}
              {blockchainSuccess && !databaseSuccess && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Your transaction was successful on the blockchain, but we couldn't record it in our database. The
                  transaction is still valid and your purchase is secure.
                </Alert>
              )}
              <DialogContentText sx={{ mt: 2 }}>
                You will be redirected to the transactions page where you can view the status of your purchase.
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {purchaseStep === 0 && (
            <>
              <Button onClick={handleCloseDialog} disabled={purchaseLoading}>
                Cancel
              </Button>
              <Button onClick={handleConfirmPurchase} color="primary" variant="contained" disabled={purchaseLoading}>
                Confirm Purchase
              </Button>
            </>
          )}

          {purchaseStep === 1 && (
            <Button onClick={handleCloseDialog} disabled={purchaseLoading}>
              Close
            </Button>
          )}

          {purchaseStep === 2 && (
            <Button onClick={handleCloseDialog} color="primary">
              Go to Transactions
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default AssetDetails


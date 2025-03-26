"use client"

import { useState, useEffect } from "react"
import { Container, Typography, Box, Grid, CircularProgress, Alert, Snackbar } from "@mui/material"
import AssetCard from "../components/AssetCard" // Assume you have an AssetCard component to display individual asset info
import { assetsApi } from "../services/api"
import web3Service from "../services/web3"

function MyAssets() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })

  const fetchAssets = async () => {
    setLoading(true)
    setError(null)

    try {
      // Retrieve the current wallet address
      const currentAccount = await web3Service.getCurrentAccount()

      // Fetch assets owned by the current account.
      // Assuming assetsApi.getByUser accepts a wallet address as parameter:
      const response = await assetsApi.getByUser(currentAccount)
      setAssets(response.data)
    } catch (err) {
      console.error("Error fetching assets:", err)
      setError("Failed to load your assets. Please try again later.")
      setSnackbar({
        open: true,
        message: "Failed to load your assets. Please try again later.",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssets()
  }, [])

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        My Assets
      </Typography>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
        </Alert>
      ) : assets.length === 0 ? (
        <Alert severity="info" sx={{ my: 4 }}>
          You don't own any assets yet.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {assets.map((asset) => (
            <Grid item xs={12} sm={6} md={4} key={asset.id}>
              <AssetCard asset={asset} />
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default MyAssets
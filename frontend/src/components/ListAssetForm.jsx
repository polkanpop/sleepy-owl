"use client"

import { useState } from "react"
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material"
import { assetsApi } from "../services/api"
import web3 from "../services/web3" // Updated import to match the file name

const categories = [
  "Art",
  "Collectibles",
  "Music",
  "Photography",
  "Trading Cards",
  "Other",
]

function ListAssetForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate form data
      if (!formData.name || !formData.price || !formData.category) {
        throw new Error("Please fill in all required fields")
      }

      // Convert price to a number
      const price = Number.parseFloat(formData.price)
      if (isNaN(price) || price <= 0) {
        throw new Error("Price must be a positive number")
      }

      // First, mint the NFT on the blockchain
      console.log("Minting NFT on blockchain...")
      
      // Retrieve current account
      const account = await web3.getCurrentAccount()
      
      // Use the image_url as the tokenURI or provide a default
      const tokenURI = formData.image_url || "https://example.com/default-token-uri.json"
      
      // Convert the price from ETH to wei using the web3 instance's utility
      const weiPrice = web3.web3.utils.toWei(formData.price.toString(), "ether")
      
      // Pass the sale price (in wei) when minting NFT
      const blockchainResult = await web3.mintNFT(account, tokenURI, weiPrice)
      console.log("Blockchain mintNFT result:", blockchainResult)
      
      // Get the token ID from the blockchain result
      // Check for either AssetMinted or Transfer event based on contract implementation
      const tokenId = blockchainResult.events.AssetMinted
        ? blockchainResult.events.AssetMinted.returnValues.assetId
        : blockchainResult.events.Transfer.returnValues.tokenId

      // Then, create the asset in the database
      const assetData = {
        ...formData,
        price: price,
        token_id: tokenId.toString(),
        owner_address: account,
        is_available: true,
      }

      console.log("Creating asset in database:", assetData)
      const response = await assetsApi.create(assetData)

      console.log("Asset created:", response.data)

      // Show success message
      setSuccess(true)
      setSnackbar({
        open: true,
        message: "Asset listed successfully!",
        severity: "success",
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category: "",
      })

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(response.data)
      }
    } catch (err) {
      console.error("Error listing asset:", err)
      setError(err.message || "Failed to list asset. Please try again.")
      setSnackbar({
        open: true,
        message: err.message || "Failed to list asset. Please try again.",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        List a New Asset
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              label="Asset Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              label="Price"
              name="price"
              type="number"
              InputProps={{
                startAdornment: <InputAdornment position="start">ETH</InputAdornment>,
                inputProps: { min: 0, step: 0.01 },
              }}
              value={formData.price}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              required
              fullWidth
              select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Image URL"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              disabled={loading}
              helperText="Enter a URL for the asset image"
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : "List Asset"}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Asset listed successfully!
        </Alert>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  )
}

export default ListAssetForm


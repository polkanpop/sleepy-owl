"use client"

import { useState, useEffect } from "react"
import { Container, Typography, Box, Alert, Paper } from "@mui/material"
import ListAssetForm from "../components/ListAssetForm"
import { useNavigate } from "react-router-dom"
import web3Service from "../services/web3"

function ListAsset() {
  const navigate = useNavigate()
  const [web3Error, setWeb3Error] = useState(null)
  const [isWeb3Ready, setIsWeb3Ready] = useState(false)

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        await web3Service.initWeb3()
        setIsWeb3Ready(true)
      } catch (err) {
        console.error("Error initializing web3:", err)
        setWeb3Error("Failed to connect to blockchain. Please make sure you have MetaMask installed and connected.")
      }
    }

    initWeb3()
  }, [])

  const handleSuccess = (asset) => {
    // Navigate to the asset details page after successful listing
    setTimeout(() => {
      navigate(`/asset/${asset.id}`)
    }, 2000)
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        List a New Asset
      </Typography>

      {web3Error ? (
        <Alert severity="error" sx={{ mb: 4 }}>
          {web3Error}
        </Alert>
      ) : !isWeb3Ready ? (
        <Paper elevation={3} sx={{ p: 4, mb: 4, textAlign: "center" }}>
          <Typography>Connecting to blockchain...</Typography>
        </Paper>
      ) : (
        <ListAssetForm onSuccess={handleSuccess} />
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Listing Guidelines
        </Typography>
        <Typography paragraph>
          When listing an asset, please provide accurate and detailed information. High-quality images and thorough
          descriptions will help your asset sell faster.
        </Typography>
        <Typography paragraph>
          All transactions are secured by smart contracts on the blockchain, ensuring a safe and transparent trading
          experience.
        </Typography>
      </Box>
    </Container>
  )
}

export default ListAsset


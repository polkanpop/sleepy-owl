"use client"

import { useState, useEffect } from "react"
import { Container, Typography, Grid, Box, CircularProgress, Pagination, Alert, Snackbar } from "@mui/material"
import AssetCard from "../components/AssetCard"
import SearchBar from "../components/SearchBar"
import { assetsApi, searchApi } from "../services/api"

function Marketplace() {
  const [assets, setAssets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchParams, setSearchParams] = useState({ query: "", category: "" })
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" })

  const itemsPerPage = 12

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await searchApi.getCategories()
        setCategories(response.data)
      } catch (err) {
        console.error("Error fetching categories:", err)
        setSnackbar({
          open: true,
          message: "Failed to load categories. Please try again later.",
          severity: "error",
        })
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true)
      setError(null)

      try {
        let response

        // If search parameters are provided, use search endpoint
        if (searchParams.query || searchParams.category) {
          response = await searchApi.search(searchParams)
        } else {
          response = await assetsApi.getAll()
        }

        setAssets(response.data)
        setTotalPages(Math.ceil(response.data.length / itemsPerPage))
      } catch (err) {
        console.error("Error fetching assets:", err)
        setError("Failed to load assets. Please try again later.")
        setSnackbar({
          open: true,
          message: "Failed to load assets. Please try again later.",
          severity: "error",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAssets()
  }, [searchParams])

  const handleSearch = (params) => {
    setSearchParams(params)
    setPage(1)
  }

  const handlePageChange = (event, value) => {
    setPage(value)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Calculate pagination
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const displayedAssets = assets.slice(startIndex, endIndex)

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Digital Asset Marketplace
      </Typography>

      <SearchBar onSearch={handleSearch} categories={categories} />

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
          No assets found. Try a different search.
        </Alert>
      ) : (
        <>
          <Grid container spacing={4}>
            {displayedAssets.map((asset) => (
              <Grid item key={asset.id} xs={12} sm={6} md={4} lg={3}>
                <AssetCard asset={asset} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
              <Pagination count={totalPages} page={page} onChange={handlePageChange} color="primary" />
            </Box>
          )}
        </>
      )}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default Marketplace


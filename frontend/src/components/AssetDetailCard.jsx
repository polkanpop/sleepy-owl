"use client"
import { Card, CardContent, CardMedia, Typography, Button, Box, Chip, Divider, Grid, Paper } from "@mui/material"

function AssetDetailCard({ asset, onPurchase }) {
  if (!asset) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">Asset not found or loading...</Typography>
      </Paper>
    )
  }

  return (
    <Card>
      <Grid container>
        <Grid item xs={12} md={6}>
          <CardMedia
            component="img"
            height="400"
            image={asset.image_url || ""}
            alt={asset.name}
            sx={{ objectFit: "contain" }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" component="div" gutterBottom>
              {asset.name}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <Chip label={asset.category} color="primary" />
              {asset.is_available ? (
                <Chip label="Available" color="success" />
              ) : (
                <Chip label="Not Available" color="error" />
              )}
            </Box>

            <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
              {asset.price} ETH
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" paragraph>
              {asset.description}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Token ID: {asset.token_id}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                Owner: {asset.owner_address.substring(0, 8)}...
                {asset.owner_address.substring(asset.owner_address.length - 6)}
              </Typography>
            </Box>

            <Box sx={{ mt: 4 }}>
              {asset.is_available && (
                <Button variant="contained" color="primary" size="large" fullWidth onClick={() => onPurchase(asset)}>
                  Purchase Now
                </Button>
              )}
            </Box>
          </CardContent>
        </Grid>
      </Grid>
    </Card>
  )
}

export default AssetDetailCard


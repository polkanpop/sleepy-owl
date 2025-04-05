import { Link as RouterLink } from "react-router-dom"
import { Box, Button, Container, Grid, Typography, Card, CardContent, Stack } from "@mui/material"
import { ShoppingCart, Security, SwapHoriz, Add } from "@mui/icons-material"

function Home() {
  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          py: 8,
          borderRadius: 2,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Decentralized Trading Platform
              </Typography>
              <Typography variant="h5" paragraph>
                Trade digital assets securely without intermediaries
              </Typography>
              <Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button component={RouterLink} to="/marketplace" variant="contained" color="secondary" size="large">
                  Explore Marketplace
                </Button>
                <Button
                  component={RouterLink}
                  to="/list-asset"
                  variant="outlined"
                  color="inherit"
                  size="large"
                  startIcon={<Add />}
                >
                  List Your Asset
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ mb: 6 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Why Choose Sleepy Owl Trading?
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <Security sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Secure Transactions
                </Typography>
                <Typography variant="body1">
                  Our smart contracts ensure that your assets are held securely until the trade is completed or
                  canceled.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <SwapHoriz sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Peer-to-Peer Trading
                </Typography>
                <Typography variant="body1">
                  Trade directly with other users without intermediaries, reducing fees and increasing transparency.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ textAlign: "center", py: 4 }}>
                <ShoppingCart sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Wide Range of Assets
                </Typography>
                <Typography variant="body1">
                  Discover and trade a diverse collection of digital assets, from art to virtual real estate.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: "background.paper", py: 6, mb: 6 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            How It Works
          </Typography>
          <Grid container spacing={2} sx={{ mt: 4 }}>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  1
                </Box>
                <Typography variant="h6" align="center">
                  Connect your wallet to Meta Mask
                </Typography>
                <Typography variant="body1" align="center">
                  Install the Meta Mask extension and connect to your wallet
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  2
                </Box>
                <Typography variant="h6" align="center">
                  List and Purchase with smart contracts
                </Typography>
                <Typography variant="body1" align="center">
                  Our smart contracts act as escrow, ensuring secure transactions. You can list your own asset.
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: "primary.main",
                    color: "white",
                    width: 50,
                    height: 50,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  3
                </Box>
                <Typography variant="h6" align="center">
                  Receive your digital assets
                </Typography>
                <Typography variant="body1" align="center">
                  Once the transaction is complete, the asset is transferred to your wallet.
                </Typography>
              </Stack>
            </Grid>
          </Grid>
          <Box sx={{ textAlign: "center", mt: 4 }}>
            <Button
              component={RouterLink}
              to="/list-asset"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<Add />}
              sx={{ mr: 2 }}
            >
              List Your Asset
            </Button>
            <Button component={RouterLink} to="/marketplace" variant="outlined" color="primary" size="large">
              Start Trading Now
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}

export default Home


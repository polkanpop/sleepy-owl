import { Link as RouterLink } from "react-router-dom"
import { Box, Button, Container, Typography } from "@mui/material"

function NotFound() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          py: 8,
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The page you are looking for does not exist or has been moved.
        </Typography>
        <Button component={RouterLink} to="/" variant="contained" color="primary" size="large">
          Go to Home
        </Button>
      </Box>
    </Container>
  )
}

export default NotFound


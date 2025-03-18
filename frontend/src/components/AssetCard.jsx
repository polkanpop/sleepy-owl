import { Link as RouterLink } from "react-router-dom"
import { Card, CardActionArea, CardActions, CardContent, CardMedia, Button, Typography, Box, Chip } from "@mui/material"

function AssetCard({ asset }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardActionArea component={RouterLink} to={`/asset/${asset.id}`}>
        <CardMedia
          component="img"
          height="200"
          image={asset.image_url || ""}
          alt={asset.name}
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div" noWrap>
            {asset.name}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              mb: 1,
            }}
          >
            {asset.description}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
            <Chip label={asset.category} size="small" />
            <Typography variant="h6" color="primary">
              {asset.price} ETH
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ mt: "auto" }}>
        <Button size="small" color="primary" component={RouterLink} to={`/asset/${asset.id}`}>
          View Details
        </Button>
      </CardActions>
    </Card>
  )
}

export default AssetCard


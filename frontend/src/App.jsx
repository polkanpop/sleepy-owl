import { Routes, Route } from "react-router-dom"
import { Container } from "@mui/material"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import Home from "./pages/Home"
import Marketplace from "./pages/Marketplace"
import AssetDetails from "./pages/AssetDetails"
import TransactionHistory from "./pages/TransactionHistory"
import ListAsset from "./pages/ListAsset"
import NotFound from "./pages/NotFound"

function App() {
  return (
    <>
      <Navbar />
      <Container component="main" sx={{ py: 4, minHeight: "calc(100vh - 128px)" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/asset/:id" element={<AssetDetails />} />
          <Route path="/transactions" element={<TransactionHistory />} />
          <Route path="/list-asset" element={<ListAsset />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
      <Footer />
    </>
  )
}

export default App


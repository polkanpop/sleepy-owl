"use client"

import { useState } from "react"
import { Paper, InputBase, IconButton, Box, Select, MenuItem, FormControl } from "@mui/material"
import { Search as SearchIcon } from "@mui/icons-material"

function SearchBar({ onSearch, categories = [] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [category, setCategory] = useState("")

  const handleSearch = (e) => {
    e.preventDefault()
    onSearch({ query: searchQuery, category })
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSearch}
      sx={{ p: "2px 4px", display: "flex", alignItems: "center", width: "100%", mb: 4 }}
    >
      <InputBase
        sx={{ ml: 1, flex: 1 }}
        placeholder="Search digital assets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        inputProps={{ "aria-label": "search digital assets" }}
      />

      {categories.length > 0 && (
        <Box sx={{ minWidth: 120, mx: 1 }}>
          <FormControl fullWidth size="small">
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              displayEmpty
              inputProps={{ "aria-label": "Select category" }}
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <IconButton type="submit" sx={{ p: "10px" }} aria-label="search">
        <SearchIcon />
      </IconButton>
    </Paper>
  )
}

export default SearchBar


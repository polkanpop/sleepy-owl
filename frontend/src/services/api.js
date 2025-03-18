import axios from "axios"

// Create an axios instance
const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  // Add timeout
  timeout: 10000,
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)

    // If there's a specific error message from the server, use it
    if (error.response && error.response.data && error.response.data.detail) {
      error.message = error.response.data.detail
    }

    return Promise.reject(error)
  },
)

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`, config.data || config.params)
    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Assets API
export const assetsApi = {
  getAll: () => api.get("/assets"),
  getById: (id) => api.get(`/assets/${id}`),
  create: (data) => api.post("/assets", data),
  update: (id, data) => api.put(`/assets/${id}`, data),
  delete: (id) => api.delete(`/assets/${id}`),
}

// Transactions API
export const transactionsApi = {
  getAll: () => api.get("/transactions"),
  getById: (id) => api.get(`/transactions/${id}`),
  getByUser: (userId) => api.get(`/transactions/user/${userId}`),
  create: (data) => api.post("/transactions", data),
  updateStatus: (id, status) => api.put(`/transactions/${id}/status?status=${status}`),
}

// Users API
export const usersApi = {
  getAll: () => api.get("/users"),
  getById: (id) => api.get(`/users/${id}`),
  getByWallet: (address) => api.get(`/users/wallet/${address}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
}

// Search API
export const searchApi = {
  search: (params) => api.get("/search", { params }),
  getCategories: () => api.get("/search/categories"),
}

// Direct API access for debugging
export const debugApi = {
  get: (url, params) => api.get(url, { params }),
  post: (url, data) => api.post(url, data),
  put: (url, data) => api.put(url, data),
  delete: (url) => api.delete(url),
}

export default api


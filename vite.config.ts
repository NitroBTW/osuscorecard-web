// Configure the Vite dev server to proxy API requests to the backend
export default {
  server: {
    // Proxy configuration for development
    proxy: {
      // Forward all /api requests to the Express backend running on port 3000
      "/api": "http://localhost:3000",
    },
  }
};
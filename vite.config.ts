import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,          // Bind to 0.0.0.0 for subdomain testing
    allowedHosts: true,  // Allow all host headers (e.g. demo.localhost subdomains)
  },
})

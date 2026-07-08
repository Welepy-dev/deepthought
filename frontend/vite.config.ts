import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    host: true,
    // O Host: chegado via nginx é "localhost:8443", diferente do :5173 nativo.
    allowedHosts: true,
    // Sem isto, o client de HMR embebe a porta 5173 e o browser tenta abrir
    // um ws:// inseguro a partir da página https://localhost:8443 (mixed content).
    hmr: process.env.VITE_HMR_CLIENT_PORT
      ? { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT) }
      : undefined,
  },
})

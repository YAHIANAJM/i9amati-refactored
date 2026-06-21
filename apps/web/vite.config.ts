import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '')
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000'
  const apiProxyIsHttps = apiProxyTarget.startsWith('https://')

  return {
    plugins: [react(), basicSsl()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: true,
      port: 5173,
      https: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: apiProxyIsHttps,
          cookieDomainRewrite: 'localhost',
        },
      },
    },
    preview: { host: true, port: 5173, https: true },
  }
})

import { defineConfig, loadEnv } from 'vite'
import createVitePlugins from './plugins'

export default defineConfig(({ mode }) => {
  // eslint-disable-next-line node/prefer-global/process
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv

  const { VITE_APP_PORT } = env

  return {
    resolve: {
      tsconfigPaths: true,
    },
    plugins: createVitePlugins(env),
    server: {
      port: +VITE_APP_PORT,
      host: true,
    },
  }
})

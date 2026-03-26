import type { PluginOption } from 'vite'
import react from '@vitejs/plugin-react'

import createCompressionPlugin from './compression'
import createDevtools from './devtools'
import createHtmlPlugin from './html'

export default function createVitePlugins(viteEnv: ImportMetaEnv) {
  const { VITE_APP_TITLE, VITE_ENABLE_DEVTOOLS } = viteEnv

  const vitePlugins: (PluginOption | PluginOption[])[] = [react()]
  vitePlugins.push(createHtmlPlugin(VITE_APP_TITLE))
  vitePlugins.push(createDevtools(VITE_ENABLE_DEVTOOLS))
  vitePlugins.push(createCompressionPlugin())

  return vitePlugins
}

import { createHtmlPlugin as vitePluginHtml } from 'vite-plugin-html'

export default function createHtmlPlugin(title: string) {
  return vitePluginHtml({
    inject: {
      data: {
        VITE_APP_TITLE: title,
      },
    },
  })
}

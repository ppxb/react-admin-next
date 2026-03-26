import { compression } from 'vite-plugin-compression2'

export default function createCompressionPlugin() {
  return compression({
    algorithms: ['gzip'],
    threshold: 10240,
    deleteOriginalAssets: false,
  })
}

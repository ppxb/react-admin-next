import { DevTools } from '@vitejs/devtools'

// 实验功能
// https://devtools.vite.dev/
export default function createDevtoolsPlugin(enable: string) {
  return enable === 'true' && DevTools()
}

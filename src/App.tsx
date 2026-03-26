import { RouterProvider } from '@tanstack/react-router'
import { ConfigProvider } from 'antd'

import { router } from '@/router'

function App() {
  return (
    <ConfigProvider>
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App

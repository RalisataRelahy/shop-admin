import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoutes from './routes/AppRoutes.tsx'
import { CallRequestProvider } from './context/CallRequestContext.tsx'

createRoot(document.getElementById('root')!).render(
  <CallRequestProvider>
    <AppRoutes />
  </CallRequestProvider>
)
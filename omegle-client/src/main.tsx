import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.tsx'
import { SocketProvider } from './context/SocketProvider.tsx'

import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
  <SocketProvider>

      <App />
  </SocketProvider>

    </BrowserRouter>
)

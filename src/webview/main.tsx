import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ContextProvider } from './Context'
import App from './App'
// import App from './Demo'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </StrictMode>,
)

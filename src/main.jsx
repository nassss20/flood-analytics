import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <NextThemesProvider attribute="class" defaultTheme="light">
        <AuthProvider>
          <App />
        </AuthProvider>
      </NextThemesProvider>
    </BrowserRouter>
  </StrictMode>,
)

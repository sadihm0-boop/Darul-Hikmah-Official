import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAdmin } from './components/admin/RequireAdmin'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminBooksPage } from './pages/admin/AdminBooksPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminModulePage } from './pages/admin/AdminModulePage'
import { AdminResearchPapersPage } from './pages/admin/AdminResearchPapersPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path="books" element={<AdminBooksPage />} />
            <Route
              path="research-papers"
              element={<AdminResearchPapersPage />}
            />
            <Route path=":module" element={<AdminModulePage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

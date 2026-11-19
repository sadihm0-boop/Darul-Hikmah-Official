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
import { AdminArticlesPage } from './pages/admin/AdminArticlesPage'
import { AdminModulePage } from './pages/admin/AdminModulePage'
import { AdminResearchPapersPage } from './pages/admin/AdminResearchPapersPage'
import { RequireAuthor } from './components/author/RequireAuthor'
import { AuthorDashboardPage } from './pages/author/AuthorDashboardPage'
import { AuthorArticleEditorPage } from './pages/author/AuthorArticleEditorPage'
import { AuthorLoginPage } from './pages/author/AuthorLoginPage'
import { AuthorRegisterPage } from './pages/author/AuthorRegisterPage'
import { PublicArticlePage } from './pages/public/PublicArticlePage'
import { PublicArticlesPage } from './pages/public/PublicArticlesPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/articles" element={<PublicArticlesPage />} />
          <Route path="/articles/:articleId" element={<PublicArticlePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/author/register" element={<AuthorRegisterPage />} />
          <Route path="/author/login" element={<AuthorLoginPage />} />
          <Route
            path="/author/dashboard"
            element={
              <RequireAuthor>
                <AuthorDashboardPage />
              </RequireAuthor>
            }
          />
          <Route
            path="/author/articles/new"
            element={
              <RequireAuthor>
                <AuthorArticleEditorPage />
              </RequireAuthor>
            }
          />
          <Route
            path="/author/articles/:articleId/edit"
            element={
              <RequireAuthor>
                <AuthorArticleEditorPage />
              </RequireAuthor>
            }
          />
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
            <Route path="articles" element={<AdminArticlesPage />} />
            <Route path=":module" element={<AdminModulePage />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CreateEditTest } from './pages/CreateEditTest';
import { AddQuestions } from './pages/AddQuestions';
import { PreviewPublish } from './pages/PreviewPublish';
import { TestView } from './pages/TestView';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-xs font-semibold rounded-xl border border-slate-100 shadow-lg',
          duration: 3500,
          style: {
            fontFamily: "'Outfit', sans-serif",
            padding: '12px 18px',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Create Test */}
        <Route
          path="/tests/create"
          element={
            <ProtectedRoute>
              <CreateEditTest />
            </ProtectedRoute>
          }
        />

        {/* Protected Edit Test */}
        <Route
          path="/tests/edit/:id"
          element={
            <ProtectedRoute>
              <CreateEditTest />
            </ProtectedRoute>
          }
        />

        {/* Protected Add Questions */}
        <Route
          path="/tests/:id/questions"
          element={
            <ProtectedRoute>
              <AddQuestions />
            </ProtectedRoute>
          }
        />

        {/* Protected Preview & Publish */}
        <Route
          path="/tests/:id/preview"
          element={
            <ProtectedRoute>
              <PreviewPublish />
            </ProtectedRoute>
          }
        />

        {/* Protected View Test */}
        <Route
          path="/tests/:id/view"
          element={
            <ProtectedRoute>
              <TestView />
            </ProtectedRoute>
          }
        />

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

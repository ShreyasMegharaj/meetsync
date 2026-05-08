import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import FloatingButterflies from "./components/FloatingButterflies";
import VideoBackground from "./components/VideoBackground";
import { useAuth } from "./context/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import AppointmentsPage from "./pages/AppointmentsPage";

// Smart redirect: /profile -> /profile/:username
// Waits for auth to load, falls back to localStorage if needed
function ProfileRedirect() {
  const { user, loading } = useAuth();

  // Wait until AuthContext finishes reading from localStorage
  if (loading) return null;

  // Try auth context first, then localStorage directly as fallback
  const username =
    user?.username ||
    user?.name ||
    (() => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        return stored.username || stored.name || null;
      } catch {
        return null;
      }
    })();

  if (username) return <Navigate to={`/profile/${username}`} replace />;
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <VideoBackground />
        <FloatingButterflies />
        <BrowserRouter>
          <Routes>

          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />

          {/* /profile with no username -> smart redirect to own profile */}
          <Route path="/profile" element={<ProtectedRoute><ProfileRedirect /></ProtectedRoute>} />

          <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Messages main page */}
          <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* Individual chat conversation */}
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* Catch-all: redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
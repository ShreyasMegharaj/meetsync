import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";
import { ThemeProvider } from "./context/ThemeContext";
import VideoBackground from "./components/VideoBackground";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";
import AppointmentsPage from "./pages/AppointmentsPage";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <VideoBackground />
          <Routes>

          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/appointments" element={<ProtectedRoute><AppointmentsPage /></ProtectedRoute>} />

          <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Messages main page */}
          <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* Individual chat conversation */}
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
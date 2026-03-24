import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>

          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Messages main page */}
          <Route path="/messages" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

          {/* Individual chat conversation */}
          <Route path="/chat/:conversationId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
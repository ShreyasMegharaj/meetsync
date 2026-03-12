import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

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

          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Messages main page */}
          <Route path="/messages" element={<ChatPage />} />

          {/* Individual chat conversation */}
          <Route path="/chat/:conversationId" element={<ChatPage />} />

          <Route path="/profile/:username" element={<ProfilePage />} />

        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
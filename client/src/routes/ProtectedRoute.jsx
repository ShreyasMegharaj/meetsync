import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();
  const token = localStorage.getItem("token");

  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/" />;

  return children;
};

export default ProtectedRoute;
// components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";

export default function ProtectedRoute({ children, role }) {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>;

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

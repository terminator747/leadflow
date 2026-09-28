import {
  Navigate,
  useLocation
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );
  }

  if (
    user.role === "client" &&
    ![
      "/dashboard",
      "/documents"
    ].includes(location.pathname)
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}
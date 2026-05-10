import { Navigate, Outlet } from "react-router-dom";
import { useAppContext } from "../context/useAppContext.js";

export const ProtectedRoute = () => {
  const { isAuth, loading } = useAppContext();

  if (loading) {
    return <div className="text-center pt-8">Loading...</div>;
  }

  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicRoute = () => {
  const { isAuth, loading } = useAppContext();

  if (loading) {
    return <div className="text-center pt-8">Loading...</div>;
  }

  return !isAuth ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

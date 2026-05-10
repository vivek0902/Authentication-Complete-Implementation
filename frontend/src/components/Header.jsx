import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppContext } from "../context/useAppContext.js";
import api from "../apiInterceptor.js";

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuth, setUser, setIsAuth } = useAppContext();

  const handleLogout = async () => {
    try {
      await api.post("/api/v1/logout");
      setUser(null);
      setIsAuth(false);
      localStorage.removeItem("email");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error(error.response?.data?.message || "Logout failed");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-5 py-4">
        <Link to="/" className="text-xl font-bold tracking-tight text-gray-900">
          Authentication App
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link
            to="/"
            className="rounded-full px-4 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
          >
            Home
          </Link>

          {isAuth ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="rounded-full px-4 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Dashboard
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-gray-900 px-4 py-2 text-white transition hover:bg-gray-700"
              >
                Logout
              </button>
              <span className="hidden text-gray-600 sm:inline">
                Welcome {user?.name || user?.email || "User"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full px-4 py-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gray-900 px-4 py-2 text-white transition hover:bg-gray-700"
              >
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;

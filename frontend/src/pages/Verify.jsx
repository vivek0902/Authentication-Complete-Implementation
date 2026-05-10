import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const server = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const Verify = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [verified, setVerified] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const hasVerifiedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasVerifiedRef.current) {
      return;
    }
    hasVerifiedRef.current = true;

    const verifyAccount = async () => {
      if (!token) {
        setErrorMessage("Verification token is missing.");
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.post(
          `${server}/api/v1/verify/${token}`,
          {},
        );
        toast.success(data?.message || "Account verified successfully.");
        setVerified(true);

        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } catch (error) {
        const message =
          error.response?.data?.message ||
          "Verification failed. Please try again.";
        setErrorMessage(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    verifyAccount();
  }, [navigate, token]);

  return (
    <section className="text-gray-600 body-font">
      <div className="container mx-auto flex min-h-[calc(100vh-80px)] items-center px-5 py-24">
        <div className="mx-auto w-full max-w-xl rounded-3xl bg-gray-100 p-8 shadow-sm md:p-10">
          <h1 className="text-3xl font-semibold text-gray-900">
            Verify Account
          </h1>

          <p className="mt-4 leading-relaxed text-gray-600">
            {loading && "Verifying your account, please wait..."}
            {!loading &&
              verified &&
              "Your account has been verified successfully. Redirecting you to login..."}
            {!loading && !verified && errorMessage}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {!loading && verified && (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="rounded-full bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-600"
              >
                Go to Login
              </button>
            )}

            {!loading && !verified && (
              <Link
                to="/register"
                className="rounded-full bg-gray-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
              >
                Back to Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Verify;

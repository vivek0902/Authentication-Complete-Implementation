import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAppContext } from "../context/useAppContext.js";

const server = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

const VerifyOtp = () => {
  const [email] = React.useState(() => {
    const storedEmail = localStorage.getItem("email");
    return storedEmail || "";
  });
  const [otp, setOtp] = React.useState("");
  const [btnLoading, setBtnLoading] = React.useState(false);

  const navigate = useNavigate();
  const { refetchUser } = useAppContext();

  React.useEffect(() => {
    if (!email) {
      toast.error("No email found. Please log in again.");
      navigate("/login");
    }
  }, [email, navigate]);
  const submitHandler = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      const { data } = await axios.post(
        `${server}/api/v1/verify-otp`,
        { email, otp },
        { withCredentials: true },
      );
      console.log(data);
      toast.success(data?.message);
      await refetchUser();
      localStorage.removeItem("email");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while verifying OTP",
      );
    } finally {
      setBtnLoading(false);
    }
  };
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
        <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
          <h1 className="title-font font-medium text-3xl text-gray-900">
            Verify OTP
          </h1>
          <p className="leading-relaxed mt-4">
            Please enter the One-Time Password (OTP) sent to your email address.
          </p>
        </div>
        <form
          onSubmit={submitHandler}
          className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
        >
          <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
            Verify OTP
          </h2>

          <div className="relative mb-4">
            <label
              htmlFor="password"
              className="leading-7 text-sm text-gray-600"
            >
              OTP
            </label>
            <input
              type="number"
              id="otp"
              name="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
            />
          </div>
          <button
            type="submit"
            className="text-white bg-indigo-500 border-0 py-2 px-8 rounded text-lg cursor-pointer transition-colors duration-200 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            disabled={btnLoading}
          >
            {btnLoading ? "Verifying OTP..." : "Verify OTP"}
          </button>
          <Link
            to="/register"
            className="text-xs text-gray-500 mt-3 cursor-pointer hover:text-indigo-600 hover:underline"
          >
            Don't have an account? Sign up
          </Link>
          <Link
            to="/login"
            className="text-xs text-gray-500 mt-1 cursor-pointer hover:text-indigo-600 hover:underline"
          >
            Back to Login
          </Link>
        </form>
      </div>
    </section>
  );
};

export default VerifyOtp;

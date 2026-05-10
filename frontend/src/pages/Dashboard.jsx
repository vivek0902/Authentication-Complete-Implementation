import React from "react";
import { useAppContext } from "../context/useAppContext.js";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user, loading, isAuth } = useAppContext();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuth && !loading) {
      navigate("/login");
    }
  }, [isAuth, loading, navigate]);

  if (loading) {
    return <div className="text-center pt-8">Loading...</div>;
  }

  if (!isAuth || !user) {
    return <div className="text-center pt-8">No user data available</div>;
  }

  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-600">Name</h2>
                <p className="text-lg text-gray-900">{user?.name || "N/A"}</p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-600">Email</h2>
                <p className="text-lg text-gray-900">{user?.email || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;

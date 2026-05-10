import { useState, useEffect } from "react";
import { AppContext } from "./appContextValue.js";
import api from "../apiInterceptor.js";

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  async function fetchUser() {
    try {
      const { data } = await api.get(`api/v1/profile`);
      setUser(data.user);
      setIsAuth(true);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUser(null);
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      if (isMounted) {
        await fetchUser();
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        loading,
        isAuth,
        setIsAuth,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

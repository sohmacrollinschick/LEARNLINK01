// context/UserContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

// Create context
const UserContext = createContext();

// Custom hook to access user context
export const useUser = () => useContext(UserContext);

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Default: no user

  useEffect(() => {
    // Fake user (change role to "admin" or "user" for testing)
    const fakeUser = {
      id: 1,
      name: "John Doe",
      role: "user", // Change to "admin" to test admin sidebar
    };

    setTimeout(() => {
      setUser(fakeUser);
    }, 500); // simulate loading
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

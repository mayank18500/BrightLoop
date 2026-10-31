import React, { createContext, useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User, Customer } from "../types/auth";
import { api } from "../services/api";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
  billingAddress?: string;
  taxId?: string;
}

export interface AuthContextType {
  user: User | null;
  customer: Customer | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{
        success: boolean;
        data: { user: User & { customer?: Customer | null } };
      }>("/auth/me");

      if (isMountedRef.current) {
        if (response.data.success && response.data.data.user) {
          const userData = response.data.data.user;
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            customerId: userData.customer?.id ?? userData.customerId ?? null,
            isActive: userData.isActive,
          });
          setCustomer(userData.customer ?? null);
        } else {
          setUser(null);
          setCustomer(null);
        }
      }
    } catch {
      if (isMountedRef.current) {
        setUser(null);
        setCustomer(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Initial session verification on startup
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Synchronize Axios logout events (e.g., session expired / refresh failure)
  useEffect(() => {
    const handleLogoutEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ reason?: string }>;
      console.warn("🔐 Session terminated by auth:logout event:", customEvent.detail?.reason);

      if (isMountedRef.current) {
        setUser(null);
        setCustomer(null);
        setIsLoading(false);
      }

      navigate("/login", { replace: true });
    };

    window.addEventListener("auth:logout", handleLogoutEvent);
    return () => {
      window.removeEventListener("auth:logout", handleLogoutEvent);
    };
  }, [navigate]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post<{
      success: boolean;
      data: { user: User; customer?: Customer | null };
    }>("/auth/login", { email, password });

    const loggedInUser = response.data.data.user;
    if (isMountedRef.current) {
      setUser(loggedInUser);
      setCustomer(response.data.data.customer ?? null);
    }
    return loggedInUser;
  };

  const register = async (data: RegisterData): Promise<User> => {
    const response = await api.post<{
      success: boolean;
      data: { user: User; customer?: Customer | null };
    }>("/auth/register", data);

    const registeredUser = response.data.data.user;
    if (isMountedRef.current) {
      setUser(registeredUser);
      setCustomer(response.data.data.customer ?? null);
    }
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      if (isMountedRef.current) {
        setUser(null);
        setCustomer(null);
      }
      navigate("/login", { replace: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        loading: isLoading,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

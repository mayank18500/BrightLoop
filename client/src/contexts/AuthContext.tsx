import React, { createContext, useEffect, useState, useCallback } from "react";
import { User, Customer } from "../types/auth";
import { api } from "../services/api";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  phone?: string;
  billingAddress?: string;
  taxId?: string;
}

interface AuthContextType {
  user: User | null;
  customer: Customer | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.get<{ success: boolean; data: { user: User & { customer?: Customer | null } } }>("/auth/me");
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
    } catch {
      setUser(null);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await api.post<{ success: boolean; data: { user: User; customer?: Customer | null } }>(
      "/auth/login",
      { email, password }
    );
    const loggedInUser = response.data.data.user;
    setUser(loggedInUser);
    setCustomer(response.data.data.customer ?? null);
    return loggedInUser;
  };

  const register = async (data: RegisterData): Promise<User> => {
    const response = await api.post<{ success: boolean; data: { user: User; customer?: Customer | null } }>(
      "/auth/register",
      data
    );
    const registeredUser = response.data.data.user;
    setUser(registeredUser);
    setCustomer(response.data.data.customer ?? null);
    return registeredUser;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
      setCustomer(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, customer, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export type { AuthContextType };

export type Role = "ADMIN" | "STAFF" | "CUSTOMER";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  customerId?: string | null;
  isActive: boolean;
}

export interface Customer {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  billingAddress?: string | null;
  taxId?: string | null;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    customer?: Customer | null;
    message?: string;
  };
}

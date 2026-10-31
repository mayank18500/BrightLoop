import { api } from "./api";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: "STAFF" | "ADMIN" | "CUSTOMER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  async listStaff(): Promise<StaffUser[]> {
    const res = await api.get<{
      success: boolean;
      data: { staff: StaffUser[] };
    }>("/users/staff");
    return res.data.data.staff;
  },

  async createStaff(payload: {
    name: string;
    email: string;
    password?: string;
  }): Promise<StaffUser> {
    const res = await api.post<{
      success: boolean;
      data: { user: StaffUser };
    }>("/users/staff", payload);
    return res.data.data.user;
  },

  async updateStaffStatus(id: string, isActive: boolean): Promise<StaffUser> {
    const res = await api.patch<{
      success: boolean;
      data: { user: StaffUser };
    }>(`/users/${id}/status`, { isActive });
    return res.data.data.user;
  },
};

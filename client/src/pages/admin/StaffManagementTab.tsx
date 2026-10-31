import React, { useEffect, useState } from "react";
import { userService, StaffUser } from "../../services/userService";
import {
  Users,
  Plus,
  Mail,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  AlertCircle,
  Shield,
  Calendar,
} from "lucide-react";

export const StaffManagementTab: React.FC = () => {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Staff@BrightLoop2026!");
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await userService.listStaff();
      setStaff(data);
    } catch (err: any) {
      console.error("Failed to load staff list", err);
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to load staff accounts.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (user: StaffUser) => {
    try {
      const updated = await userService.updateStaffStatus(user.id, !user.isActive);
      setStaff((prev) => prev.map((s) => (s.id === user.id ? updated : s)));
      setFeedback({
        type: "success",
        text: `Staff member ${user.name} is now ${updated.isActive ? "active" : "deactivated"}.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to update staff status.",
      });
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newStaff = await userService.createStaff({ name, email, password });
      setFeedback({
        type: "success",
        text: `Staff account created for ${newStaff.name} (${newStaff.email}).`,
      });
      setShowAddModal(false);
      setName("");
      setEmail("");
      setPassword("Staff@BrightLoop2026!");
      await fetchStaff();
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.response?.data?.error?.message || "Failed to create staff account.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#2563EB]" />
            Staff Member Directory & Roles
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Delegate proposal creation, subscription lifecycle operations, and payment allocation authority to internal team members.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff Member
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-[#15803D] border border-emerald-200"
              : "bg-rose-50 text-[#B91C1C] border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#B91C1C]" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-[#6B7280] hover:text-[#172554] p-1 rounded-lg transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div className="rounded-xl border border-[#E2E7EF] bg-white overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-[#596579] flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mb-2" />
            <span className="text-xs">Loading staff accounts...</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-[#596579]">
            <Users className="w-10 h-10 text-[#687386] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[#172554]">No Staff Members Added</div>
            <div className="text-xs text-[#596579] mt-1">
              Add operational staff members above to delegate billing tasks.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] text-[#344054] font-bold uppercase tracking-wider border-b border-[#E2E7EF]">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3 font-semibold text-[#172554] flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1D4ED8] border border-blue-200 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-4 py-3 text-[#263247] font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#596579]" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1D4ED8] border border-blue-200">
                        <Shield className="w-3 h-3" />
                        STAFF
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#596579]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm ${
                          u.isActive
                            ? "bg-rose-50 hover:bg-rose-100 text-[#B91C1C] border border-rose-200"
                            : "bg-emerald-50 hover:bg-emerald-100 text-[#15803D] border border-emerald-200"
                        }`}
                      >
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2E7EF] rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 px-6 border-b border-[#E2E7EF] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-[#172554] text-base">Add Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#344054] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@brightloop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] text-xs focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#344054] mb-1">Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E2E7EF] rounded-lg text-[#202938] text-xs font-mono focus:outline-none focus:border-[#2563EB]"
                />
                <p className="text-[11px] text-[#596579] mt-1">
                  Must contain 8+ characters, uppercase, lowercase, number, and special symbol.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#E2E7EF]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E2E7EF] hover:bg-[#F8FAFC] text-[#596579] font-semibold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs shadow-sm hover:shadow transition disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Staff Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

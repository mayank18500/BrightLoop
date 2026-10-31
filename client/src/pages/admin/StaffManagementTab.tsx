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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Staff Member Directory & Roles
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Delegate proposal creation, subscription lifecycle operations, and payment allocation authority to internal team members.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Staff Member
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Staff Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
            <span className="text-xs">Loading staff accounts...</span>
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-slate-300">No Staff Members Added</div>
            <div className="text-xs text-slate-500 mt-1">
              Add operational staff members above to delegate billing tasks.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Created Date</th>
                  <th className="px-4 py-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staff.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <Shield className="w-3 h-3" />
                        STAFF
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                          u.isActive
                            ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30"
                            : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-white text-sm">Add Staff Member</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="alex@brightloop.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Temporary Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Must contain 8+ characters, uppercase, lowercase, number, and special symbol.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
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

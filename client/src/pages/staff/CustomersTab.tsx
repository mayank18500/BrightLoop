import React, { useEffect, useState } from "react";
import { quotationService, CustomerInfo } from "../../services/quotationService";
import {
  Building2,
  Search,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  X,
  FileText,
} from "lucide-react";

export const CustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerInfo | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await quotationService.listCustomers({ search: search || undefined });
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customer directory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            Customer & Account Directory
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Enterprise client accounts, billing addresses, tax identifiers, and contact persons.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, contact, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <span className="text-sm">Loading customer directory...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No Customers Found</h3>
            <p className="text-sm text-slate-500 mt-1">
              New customer profiles are automatically provisioned upon client portal registration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Company Name</th>
                  <th className="py-3.5 px-4">Primary Contact</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Tax / GST ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.companyName.charAt(0).toUpperCase()}
                      </div>
                      <span>{c.companyName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {c.contactName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {c.taxId || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Active"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-2.5 py-1 text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Detail Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedCustomer.companyName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedCustomer.companyName}
                  </h3>
                  <p className="text-xs text-slate-500">Commercial Client Profile</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Primary Contact</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">{selectedCustomer.contactName}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase">Status</div>
                  <div className="text-sm font-bold text-emerald-600 mt-1">Verified Client</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="font-mono">{selectedCustomer.email}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.taxId && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>Tax / GST ID: <strong className="font-mono text-slate-900">{selectedCustomer.taxId}</strong></span>
                  </div>
                )}
                {selectedCustomer.billingAddress && (
                  <div className="flex items-start gap-2 text-slate-600 pt-1">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedCustomer.billingAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

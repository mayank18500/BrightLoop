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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#172554] flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#2563EB]" />
            Customer & Account Directory
          </h2>
          <p className="text-sm text-[#596579] mt-1">
            Enterprise client accounts, billing addresses, tax identifiers, and contact persons.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#687386]" />
          <input
            type="text"
            placeholder="Search company, contact, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-white border border-[#E2E7EF] rounded-xl text-xs text-[#202938] placeholder-[#687386] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] shadow-sm"
          />
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-xl border border-[#E2E7EF] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#596579] flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2563EB] mb-2" />
            <span className="text-xs">Loading customer directory...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-[#596579]">
            <Building2 className="w-12 h-12 text-[#687386] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-[#172554]">No Customers Found</h3>
            <p className="text-xs text-[#596579] mt-1">
              New customer profiles are automatically provisioned upon client portal registration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E7EF] text-[11px] font-bold text-[#344054] uppercase tracking-wider">
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
              <tbody className="divide-y divide-[#E2E7EF] text-[#263247]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#172554] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D4ED8] border border-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                        {c.companyName.charAt(0).toUpperCase()}
                      </div>
                      <span>{c.companyName}</span>
                    </td>
                    <td className="py-3.5 px-4 text-[#263247] font-medium">
                      {c.contactName}
                    </td>
                    <td className="py-3.5 px-4 text-[#263247] font-mono text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#596579]" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#596579]">
                      {c.taxId || "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isActive !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#15803D] border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#B91C1C] border border-rose-200">
                          <XCircle className="w-3.5 h-3.5" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-[#596579]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                        <span>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Active"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1 text-xs font-semibold bg-blue-50 text-[#1D4ED8] hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-[#E2E7EF] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#E2E7EF] bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {selectedCustomer.companyName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-[#172554] text-base">
                    {selectedCustomer.companyName}
                  </h3>
                  <p className="text-xs text-[#596579]">Commercial Client Profile</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-[#6B7280] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E7EF]">
                  <div className="text-[11px] font-bold text-[#596579] uppercase">Primary Contact</div>
                  <div className="text-sm font-bold text-[#172554] mt-1">{selectedCustomer.contactName}</div>
                </div>
                <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#E2E7EF]">
                  <div className="text-[11px] font-bold text-[#596579] uppercase">Status</div>
                  <div className="text-sm font-bold text-[#15803D] mt-1">Verified Client</div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-[#E2E7EF]">
                <div className="flex items-center gap-2.5 text-[#263247]">
                  <Mail className="w-4 h-4 text-[#596579]" />
                  <span className="font-mono text-xs">{selectedCustomer.email}</span>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-2.5 text-[#263247]">
                    <Phone className="w-4 h-4 text-[#596579]" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.taxId && (
                  <div className="flex items-center gap-2.5 text-[#263247]">
                    <FileText className="w-4 h-4 text-[#596579]" />
                    <span>Tax / GST ID: <strong className="font-mono text-[#172554]">{selectedCustomer.taxId}</strong></span>
                  </div>
                )}
                {selectedCustomer.billingAddress && (
                  <div className="flex items-start gap-2.5 text-[#263247] pt-1">
                    <MapPin className="w-4 h-4 text-[#596579] shrink-0 mt-0.5" />
                    <span>{selectedCustomer.billingAddress}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 px-6 border-t border-[#E2E7EF] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 text-xs font-semibold text-[#596579] hover:bg-white border border-[#E2E7EF] rounded-lg transition shadow-sm"
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

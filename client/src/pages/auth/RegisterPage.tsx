import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Receipt,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    phone: "",
    billingAddress: "",
    taxId: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password rules validation
  const hasMinLength = formData.password.length > 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasLower = /[a-z]/.test(formData.password);
  const hasSpecial = /[^A-Za-z0-9]/.test(formData.password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setErrorMessage("Please ensure your password meets all complexity requirements.");
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await register(formData);
      navigate("/portal/overview", { replace: true });
    } catch (err: unknown) {
      const msg =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : "Registration failed. Please check your details.");
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#202938] selection:bg-[#EEF4FF] selection:text-[#4169E1]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#172554] shadow-md shadow-[#172554]/15 mb-4">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202938]">
          Create Commercial Customer Account
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#758096]">
          Subscribe to software licenses, track renewals, and manage billing invoices
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-[#E8EAF0] py-8 px-6 shadow-[0_4px_24px_rgba(16,24,40,0.06)] rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-[#FDEEEE] border border-[#FACDCD] p-3.5 text-xs text-[#DC5353] flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Company / Organization Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Global Inc"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Contact Person Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Commercial Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="billing@acmeglobal.com"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Tax / GST Identification Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="27ABCDE1234F1Z5"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                  Billing Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="Tower 4, Cyber City, Bangalore"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                Portal Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#758096]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters with symbol & uppercase"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                />
              </div>

              {/* Password strength checklist */}
              <div className="mt-2.5 p-3 rounded-xl bg-[#FAFBFD] border border-[#E8EAF0] grid grid-cols-2 gap-2 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 ${hasMinLength ? "text-[#16A36A]" : "text-[#758096]"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>8+ characters</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${hasUpper ? "text-[#16A36A]" : "text-[#758096]"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Uppercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${hasLower ? "text-[#16A36A]" : "text-[#758096]"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Lowercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 ${hasSpecial ? "text-[#16A36A]" : "text-[#758096]"}`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Special character</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#4169E1] hover:bg-[#3055C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4169E1] transition shadow-sm shadow-[#4169E1]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Provisioning Account...
                  </>
                ) : (
                  <>
                    Complete Registration & Open Portal
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-[#758096] mt-6">
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-[#4169E1] hover:underline">
            Sign in to existing account
          </Link>
        </p>
      </div>
    </div>
  );
};

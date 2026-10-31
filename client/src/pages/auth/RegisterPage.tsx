import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Building2, User, Mail, Lock, Phone, MapPin, Receipt, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

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
      navigate("/portal", { replace: true });
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Decorative gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25 mb-4">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Create Commercial Customer Account
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Subscribe to software licenses, track renewals, and manage billing invoices
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-400 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Organization Name *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Acme Enterprises Inc."
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contact Person Full Name *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Business Email Address *
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@acme.com"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contact Phone
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Phone className="h-4 w-4" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 9 chars, uppercase, lowercase, special char"
                  className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Password strength checklist */}
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-400" : ""}`}>
                  <CheckCircle2 className="h-3 w-3" /> &gt; 8 characters
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpper ? "text-emerald-400" : ""}`}>
                  <CheckCircle2 className="h-3 w-3" /> Uppercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasLower ? "text-emerald-400" : ""}`}>
                  <CheckCircle2 className="h-3 w-3" /> Lowercase letter
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecial ? "text-emerald-400" : ""}`}>
                  <CheckCircle2 className="h-3 w-3" /> Special character
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tax Registration Number (GSTIN/VAT)
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="GSTIN29AAACA1234A1Z5"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Billing Address
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="City, State, Country"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || !isPasswordValid}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition shadow-lg shadow-blue-600/30 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Registering Account...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

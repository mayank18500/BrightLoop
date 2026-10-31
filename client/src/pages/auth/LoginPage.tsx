import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Mail, Lock, AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "STAFF") {
        navigate("/staff/dashboard", { replace: true });
      } else {
        navigate("/portal/overview", { replace: true });
      }
    } catch (err: unknown) {
      const msg =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (err as any)?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.");
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#FCFCFA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#202938] selection:bg-[#EEF4FF] selection:text-[#4169E1]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        {/* Brand Emblem */}
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-[#172554] shadow-md shadow-[#172554]/15 mb-4">
          <span className="text-lg tracking-tight font-extrabold text-white">BL</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#202938]">
          Sign in to BrightLoop
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-[#758096]">
          Unified Subscription Management & Recurring Billing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-white border border-[#E8EAF0] py-8 px-6 shadow-[0_4px_24px_rgba(16,24,40,0.06)] rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-[#FDEEEE] border border-[#FACDCD] p-3.5 text-xs text-[#DC5353] flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#202938] mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[#758096]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.com"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#202938]">
                  Password
                </label>
                <span className="text-[11px] text-[#4169E1] hover:underline cursor-pointer">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[#758096]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#E8EAF0] rounded-xl text-[#202938] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#4169E1] focus:ring-2 focus:ring-[#EEF4FF] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#4169E1] hover:bg-[#3055C4] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4169E1] transition shadow-sm shadow-[#4169E1]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Console
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-6 border-t border-[#F0F2F6]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#758096] mb-3">
              <Sparkles className="h-3.5 w-3.5 text-[#E6A23C]" />
              Quick Demo Personas
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials("admin@brightloop.com", "Admin@123")}
                className="py-1.5 px-2 rounded-lg bg-[#FAFBFD] hover:bg-[#EEF4FF] border border-[#E8EAF0] hover:border-[#D4E3FF] text-[11px] font-medium text-[#202938] transition text-center cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("staff@brightloop.com", "Staff@123")}
                className="py-1.5 px-2 rounded-lg bg-[#FAFBFD] hover:bg-[#EEF4FF] border border-[#E8EAF0] hover:border-[#D4E3FF] text-[11px] font-medium text-[#202938] transition text-center cursor-pointer"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("customer@acmecorp.com", "Customer@123")}
                className="py-1.5 px-2 rounded-lg bg-[#FAFBFD] hover:bg-[#EEF4FF] border border-[#E8EAF0] hover:border-[#D4E3FF] text-[11px] font-medium text-[#202938] transition text-center cursor-pointer"
              >
                Customer
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[#758096] mt-6">
          Commercial client without credentials?{" "}
          <Link to="/register" className="font-semibold text-[#4169E1] hover:underline">
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
};

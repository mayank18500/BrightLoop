import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

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
        navigate("/admin", { replace: true });
      } else if (user.role === "STAFF") {
        navigate("/staff", { replace: true });
      } else {
        navigate("/portal", { replace: true });
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
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Decorative gradient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 shadow-lg shadow-blue-500/25 mb-4">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Sign in to BrightLoop
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Unified Subscription Management & Recurring Billing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-400 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-xs text-slate-500 hover:text-blue-400 cursor-pointer transition">
                  Forgot password?
                </span>
              </div>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition shadow-lg shadow-blue-600/30 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign in to Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Quick Demo Accounts
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickCredentials("admin@brightloop.com", "Admin@BrightLoop2026!")}
                className="py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 font-medium transition text-center cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("staff@brightloop.com", "Staff@BrightLoop2026!")}
                className="py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 font-medium transition text-center cursor-pointer"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => fillQuickCredentials("customer@acmecorp.com", "Customer@BrightLoop2026!")}
                className="py-1.5 px-2 rounded-lg border border-slate-800 bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-300 font-medium transition text-center cursor-pointer"
              >
                Customer
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Need a new customer commercial account?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium underline">
              Register company
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

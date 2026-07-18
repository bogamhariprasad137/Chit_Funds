import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Landmark } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your login details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-milk flex flex-col md:flex-row font-body-md text-plum">
      {/* Left Column: Visual Brand Hero (Desktop Only) */}
      <section className="hidden md:flex md:w-[45%] bg-plum relative overflow-hidden flex-col justify-between p-12 text-milk border-r border-milk/10 shadow-milk-lg">
        {/* Subtle decorative grid/mesh */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-milk/10 blur-[150px] rounded-lg"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-milk/10 blur-[150px] rounded-lg"></div>
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-milk flex items-center justify-center text-plum shadow-milk-sm transition-transform duration-200 hover:rotate-6">
            <Landmark className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-milk">
              Chit<span className="text-milk/80 font-medium">Ledger</span>
            </h2>
            <p className="text-[9px] font-bold text-milk/60 uppercase tracking-widest mt-0.5 leading-none">
              Secure Ledger System
            </p>
          </div>
        </div>

        {/* Brand Content */}
        <div className="relative z-10 space-y-6 max-w-sm my-auto">
          <p className="text-milk/80 font-bold tracking-wider text-[10px] uppercase font-geist">Institutional Access Only</p>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-milk">
            Managing chit funds with mathematical precision.
          </h2>
          <p className="text-milk/60 text-sm leading-relaxed">
            Verify payment records, manage active chit groups, run custom reports, and securely issue payouts with live audit history.
          </p>
        </div>

        {/* Brand Footer */}
        <div className="relative z-10 pt-8 border-t border-milk/10 flex items-center justify-between text-xs text-milk/50 font-bold">
          <span>&copy; {new Date().getFullYear()} ChitLedger Systems</span>
          <span className="font-mono text-[9px] text-milk/40">v2.5.0-Stable</span>
        </div>
      </section>

      {/* Right Column: Authentication Form Gateway */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-12 relative bg-milk">
        <div className="w-full max-w-[380px] space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          
          {/* Header Mobile Brand & Section Title */}
          <div className="text-center md:text-left space-y-3">
            {/* Logo on mobile view only */}
            <div className="md:hidden flex justify-center mb-6">
              <div className="flex items-center gap-3 bg-milk p-3 rounded-lg border border-plum/25 shadow-plum-sm">
                <Landmark className="w-5 h-5 text-plum" />
                <span className="text-base font-bold text-plum">
                  Chit<span className="text-plum/85 font-medium">Ledger</span>
                </span>
              </div>
            </div>
            
            <h1 className="text-2xl font-extrabold tracking-tight text-plum">
              Sign In
            </h1>
            <p className="text-sm font-medium text-plum/70">
              Enter your credentials to manage active ledgers.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-plum/80 uppercase tracking-wider block" htmlFor="email">
                Institutional Email
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 text-sm input-milk" 
                  id="email" 
                  name="email" 
                  placeholder="name@chitledger.com" 
                  required 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-plum/80 uppercase tracking-wider block" htmlFor="password">
                  Security Code / Password
                </label>
              </div>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-plum/50 group-focus-within:text-plum transition-colors duration-200" />
                <input 
                  className="w-full pl-10 pr-12 py-2.5 text-sm input-milk font-mono" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-plum/50 hover:text-plum transition-all duration-200 p-1 hover:scale-105 active:scale-95 cursor-pointer" 
                  onClick={() => setShowPassword(!showPassword)} 
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="text-plum bg-milk p-3 rounded-lg border border-plum font-semibold text-xs animate-in fade-in duration-300">
                {error}
              </div>
            )}

            {/* Submit CTA Button with Hover Inversion */}
            <button 
              className="w-full btn-plum py-2.5 px-4 flex items-center justify-center gap-2 disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  Verifying Authenticity...
                  <span className="w-3.5 h-3.5 border-2 border-milk border-t-transparent rounded-lg animate-spin"></span>
                </>
              ) : (
                "Authenticate Access"
              )}
            </button>
          </form>

          {/* Security Notice Area with Hover elevation */}
          <div className="card-milk p-4 flex items-start gap-3">
            <ShieldCheck className="w-4.5 h-4.5 text-plum mt-0.5 shrink-0" />
            <p className="text-[10px] text-plum/70 leading-normal font-bold">
              Authorized access only. System monitoring and compliance ledger logging is active for all transactions.
            </p>
          </div>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <span className="text-[11px] text-plum/50 font-semibold select-none">
              Forgot Credentials? Contact System Administrator
            </span>
          </div>

        </div>
      </main>
    </div>
  );
}

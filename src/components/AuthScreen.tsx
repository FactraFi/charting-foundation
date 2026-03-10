import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import FactraScoreGauge from "./FactraScoreGauge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const AuthScreen = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (authView === 'forgot') {
        if (!email) { setError('Please enter your email address.'); return; }
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) { setError(err.message); return; }
        setConfirmationSent(true);
        return;
      }

      if (!email || !password) { setError('Please fill in all fields.'); return; }

      if (authView === 'signup') {
        if (!name) { setError('Please enter your full name.'); return; }
        const { error: err } = await signUp(email, password, name);
        if (err) { setError(err); return; }
        // Show check-email message for email confirmation
        setConfirmationSent(true);
        return;
      }

      // Login
      const { error: err } = await signIn(email, password);
      if (err) { setError(err); return; }
      navigate('/');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleView = () => {
    setError('');
    setConfirmationSent(false);
    setAuthView(prev => prev === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />

      {/* Left Panel - Form */}
      <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-24 relative z-10 animate-fade-in-up">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-foreground/10 flex items-center justify-center text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
                <Terminal size={24} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground font-brand">
                Factra<span className="text-primary">Fi</span>
              </span>
            </div>

            {authView === 'forgot' ? (
              <>
                <h1 className="text-3xl font-bold text-foreground font-brand">Reset Password</h1>
                <p className="text-muted-foreground">Enter your email to receive reset instructions.</p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-foreground font-brand">
                  {authView === 'login' ? 'Institutional Clarity.' : 'Start Trading on Facts.'}
                </h1>
                <p className="text-muted-foreground">
                  {authView === 'login'
                    ? 'Welcome back. Enter your credentials to access the dashboard.'
                    : 'Join thousands of traders using AI-led quantitative algorithms.'}
                </p>
              </>
            )}
          </div>

          {/* Form */}
          {!confirmationSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {authView === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={20} />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe"
                      className="w-full bg-secondary border border-border text-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all hover:border-muted-foreground/30 font-sans" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-3 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={20} />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"
                    className="w-full bg-secondary border border-border text-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all hover:border-muted-foreground/30 font-sans" />
                </div>
              </div>

              {authView !== 'forgot' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-muted-foreground">Password</label>
                    {authView === 'login' && (
                      <button type="button" onClick={() => setAuthView('forgot')} className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={20} />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full bg-secondary border border-border text-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all hover:border-muted-foreground/30 font-sans" />
                  </div>
                </div>
              )}

              {error && (
                <div className="text-destructive text-sm flex items-center gap-2 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:bg-primary/90 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_hsl(var(--primary)/0.2)] disabled:opacity-50">
                {submitting ? 'Please wait...' : authView === 'login' ? 'Sign In' : authView === 'signup' ? 'Create Account' : 'Send Reset Link'}
                {!submitting && authView !== 'forgot' && <ArrowRight size={20} />}
              </button>
            </form>
          ) : (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center space-y-4 animate-fade-in-up">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-foreground font-bold text-xl font-brand">Check your inbox</h3>
              <p className="text-muted-foreground text-sm">
                We've sent {authView === 'forgot' ? 'password reset instructions' : 'a confirmation link'} to <strong className="text-foreground">{email}</strong>.
              </p>
              <button onClick={() => { setAuthView('login'); setConfirmationSent(false); }}
                className="text-primary font-bold text-sm hover:underline mt-4 block w-full">
                Back to Sign In
              </button>
            </div>
          )}

          {/* Footer */}
          {!confirmationSent && (
            <div className="text-center text-sm text-muted-foreground">
              {authView === 'login' ? "Don't have an account? " : authView === 'signup' ? "Already have an account? " : "Remember your password? "}
              <button onClick={authView === 'forgot' ? () => setAuthView('login') : toggleView}
                className="text-foreground font-medium hover:text-primary transition-colors">
                {authView === 'login' ? 'Sign Up' : 'Sign In'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex flex-1 bg-card relative items-center justify-center border-l border-border overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent animate-pulse" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up delay-200">
          <FactraScoreGauge score={88} size="large" />
          <div className="mt-12 text-center max-w-md px-6">
            <h2 className="text-2xl font-bold text-foreground mb-4 font-brand">Stop Trading on Feelings.</h2>
            <p className="text-muted-foreground">Cut through market noise with a unified score, backed by AI-led quantitative algorithms.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;

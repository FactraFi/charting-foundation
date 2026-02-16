import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Terminal, Lock, CheckCircle, AlertCircle } from "lucide-react";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check for recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true);
    });

    // Also check hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) setIsRecovery(true);

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => navigate("/"), 2000);
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Invalid or expired reset link.</p>
          <button onClick={() => navigate("/login")} className="text-primary font-bold hover:underline">Back to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="absolute inset-0 tech-grid-bg opacity-20 pointer-events-none" />
      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded bg-foreground/10 flex items-center justify-center text-primary">
            <Terminal size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground font-brand">
            Factra<span className="text-primary">Fi</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold text-foreground font-brand">Set New Password</h1>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">New Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={20} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full bg-secondary border border-border text-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-sans" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 text-muted-foreground/50 group-focus-within:text-primary transition-colors" size={20} />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••"
                  className="w-full bg-secondary border border-border text-foreground rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-sans" />
              </div>
            </div>
            {error && (
              <div className="text-destructive text-sm flex items-center gap-2 bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-lg hover:bg-primary/90 transition-all">
              Update Password
            </button>
          </form>
        ) : (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-foreground font-bold text-xl font-brand">Password Updated</h3>
            <p className="text-muted-foreground text-sm">Redirecting to dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

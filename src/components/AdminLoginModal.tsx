import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError("Fel e-post eller lösenord");
      setLoading(false);
      return;
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-sm mx-4 rounded-lg bg-stone-900 border border-white/10 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-base font-bold text-white mb-4">Admin-inloggning</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
          />
          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Logga in"}
          </button>
        </form>
      </div>
    </div>
  );
}

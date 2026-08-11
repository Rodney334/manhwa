"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";
import { ApiError } from "@/lib/api/client";
import { toast } from "@/lib/stores/toast.store";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.resetPassword(code, password);
      // Le backend révoque toutes les sessions ouvertes : on renvoie donc
      // systématiquement vers /login, il n'y a pas de session à réutiliser.
      toast.success("Mot de passe réinitialisé. Connecte-toi avec ton nouveau mot de passe.");
      router.push("/login");
    } catch (e) {
      // Code invalide, expiré ou déjà consommé renvoient tous le même 400,
      // sans distinction (anti-énumération côté backend).
      setError(e instanceof ApiError ? e.message : "Code invalide ou expiré. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ligne bg-sur/60 p-7 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-normal">Nouveau mot de passe</h1>
        <p className="text-[13px] text-txt3 mt-1">
          Colle le code reçu par e-mail et choisis un nouveau mot de passe.
        </p>
        <p className="text-[12px] text-txt3 mt-1">
          Pas de trace du mail ? Regarde du côté des{" "}
          <b className="text-txt2">spams / courrier indésirable</b>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-txt3">Code reçu par e-mail</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="a1b2c3d4e5"
            autoFocus
            required
            className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] font-mono outline-none focus:border-vert/50 transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-txt3">Nouveau mot de passe</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={8}
            className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
          />
        </label>
        <p className="text-[11.5px] text-txt3 -mt-2">
          8 caractères minimum, au moins une lettre et un chiffre.
        </p>

        {error && <p className="text-[12.5px] text-rouge">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 bg-vert text-[#05130c] font-medium text-[14px] rounded-lg py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Réinitialiser le mot de passe
        </button>
      </form>

      <p className="text-center text-[13px] text-txt3">
        Pas de code ?{" "}
        <Link href="/mot-de-passe-oublie" className="text-vert hover:underline">
          Redemander un envoi
        </Link>
      </p>
    </div>
  );
}
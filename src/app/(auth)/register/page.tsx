"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";
import { tokenManager, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/lib/stores/toast.store";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.register({ username, email, password });
      const { user, accessToken, refreshToken } = await authService.login({
        identifier: email,
        password,
      });
      tokenManager.setTokens(accessToken, refreshToken);
      setUser(user);
      toast.success("Bienvenue sur ManhwaList.");
      router.push("/app");
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Inscription impossible. Réessaie.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ligne bg-sur/60 p-7 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-normal">Inscription</h1>
        <p className="text-[13px] text-txt3 mt-1">
          Trois champs, rien de plus. 8 caractères minimum, une lettre, un chiffre.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Field
          label="Nom d'utilisateur"
          value={username}
          onChange={setUsername}
          placeholder="kofi_reads"
          autoFocus
        />
        <Field
          label="Adresse e-mail"
          value={email}
          onChange={setEmail}
          type="email"
          placeholder="kofi@exemple.bj"
        />
        <Field
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="••••••••"
        />

        {error && <p className="text-[12.5px] text-rouge">{error}</p>}

        <label className="flex items-start gap-2.5 text-[12.5px] text-txt3">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            required
            className="mt-0.5 accent-vert w-3.5 h-3.5 shrink-0"
          />
          <span>
            J&apos;ai lu et j&apos;accepte les{" "}
            <Link href="/cgu" target="_blank" className="text-vert hover:underline">
              conditions générales d&apos;utilisation
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !acceptedTerms}
          className="mt-1 flex items-center justify-center gap-2 bg-vert text-[#05130c] font-medium text-[14px] rounded-lg py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Créer mon compte
        </button>
      </form>

      <p className="text-center text-[13px] text-txt3">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-vert hover:underline">
          Connecte-toi
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] text-txt3">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required
        minLength={type === "password" ? 8 : undefined}
        className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
      />
    </label>
  );
}
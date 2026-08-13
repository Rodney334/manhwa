"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";
import { tokenManager, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/lib/stores/toast.store";
import { Loader2 } from "lucide-react";

// Sécurité minimale : n'accepter qu'un chemin interne (commence par `/`,
// jamais par `//` qui serait interprété comme une URL absolue par le
// navigateur) — sinon `redirect` deviendrait une façon d'envoyer quelqu'un
// qui vient de se connecter vers un site tiers.
function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/app";
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const setUser = useAuthStore((s) => s.setUser);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken, refreshToken } = await authService.login({
        identifier,
        password,
      });
      tokenManager.setTokens(accessToken, refreshToken);
      setUser(user);
      toast.success(`Content de te revoir, ${user.username}.`);
      router.push(redirectTo);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Connexion impossible. Réessaie.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ligne bg-sur/60 p-7 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-normal">Connexion</h1>
        <p className="text-[13px] text-txt3 mt-1">
          Ton pseudo ou ton adresse, peu importe lequel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <Field
          label="Identifiant"
          value={identifier}
          onChange={setIdentifier}
          placeholder="kofi_reads ou kofi@exemple.bj"
          autoFocus
        />
        <Field
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          type="password"
          placeholder="••••••••"
        />

        <Link
          href="/mot-de-passe-oublie"
          className="self-end text-[12px] text-txt3 hover:text-vert transition-colors -mt-1"
        >
          Mot de passe oublié ?
        </Link>

        {error && <p className="text-[12.5px] text-rouge">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 bg-vert text-[#05130c] font-medium text-[14px] rounded-lg py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          Se connecter
        </button>
      </form>

      <p className="text-center text-[13px] text-txt3">
        Pas encore de compte ?{" "}
        <Link
          href={`/register${redirectTo !== "/app" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-vert hover:underline"
        >
          Inscris-toi
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
        className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
      />
    </label>
  );
}
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";
import { tokenManager, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/lib/stores/toast.store";
import { Loader2, Eye, EyeOff } from "lucide-react";

const FIELD_LABELS: Record<string, string> = {
  username: "Nom d'utilisateur",
  email: "Adresse e-mail",
  password: "Mot de passe",
};

// Le backend renvoie déjà un message précis (« Lettres, chiffres et tiret
// bas uniquement »), mais affiché seul, en bas du formulaire, rien
// n'indique VISUELLEMENT à quel champ il se rapporte — surtout gênant ici
// où il apparaît juste après le mot de passe alors qu'il concerne souvent
// le nom d'utilisateur. Le préfixer avec le nom du champ lève toute
// ambiguïté, quelle que soit sa position à l'écran.
function describeError(e: unknown): string {
  if (!(e instanceof ApiError)) return "Inscription impossible. Réessaie.";

  const field = e.body?.errors?.[0]?.path ?? e.body?.errors?.[0]?.param;
  const label = typeof field === "string" ? FIELD_LABELS[field] : undefined;

  return label ? `${label} — ${e.message}` : e.message;
}

function safeRedirect(raw: string | null): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return "/app";
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
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
      router.push(redirectTo);
    } catch (e) {
      setError(describeError(e));
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
        <div className="flex flex-col gap-1">
          <Field
            label="Nom d'utilisateur"
            value={username}
            onChange={setUsername}
            placeholder="kofi_reads"
            autoFocus
          />
          <p className="text-[11px] text-txt3 px-0.5">
            Lettres, chiffres et tiret bas uniquement — accents acceptés, pas d&apos;espaces.
          </p>
        </div>
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
        <Link
          href={`/login${redirectTo !== "/app" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-vert hover:underline"
        >
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
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] text-txt3">{label}</span>
      <div className="relative">
        <input
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          required
          minLength={isPassword ? 8 : undefined}
          className={`w-full bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors ${
            isPassword ? "pr-10" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-0 top-0 h-full px-3 flex items-center text-txt3 hover:text-txt2 transition-colors"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </label>
  );
}
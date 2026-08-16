"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";
import { tokenManager, ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/lib/stores/toast.store";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
import { PasswordRequirements } from "@/components/features/PasswordRequirements";
import { Loader2, Eye, EyeOff } from "lucide-react";

// Le backend renvoie déjà un message précis (« Lettres, chiffres et tiret
// bas uniquement »), mais affiché seul, en bas du formulaire, rien
// n'indique VISUELLEMENT à quel champ il se rapporte — surtout gênant ici
// où il apparaît juste après le mot de passe alors qu'il concerne souvent
// le nom d'utilisateur. Le préfixer avec le nom du champ lève toute
// ambiguïté, quelle que soit sa position à l'écran.
function describeError(e: unknown, t: Messages["auth"]): string {
  if (!(e instanceof ApiError)) return t.register.genericError;

  // Lu directement plutôt que via le typage partagé `ApiErrorBody` : le
  // corps de la réponse est de toute façon d'origine externe (le backend),
  // pas la peine de faire dépendre ce composant d'un type précis qui
  // pourrait ne pas être synchronisé.
  const body = e.body as { errors?: { path?: string; param?: string }[] } | undefined;
  const field = body?.errors?.[0]?.path ?? body?.errors?.[0]?.param;
  const label = typeof field === "string" ? t.register.fieldLabels[field as keyof typeof t.register.fieldLabels] : undefined;

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
  const t = useTranslations("auth");
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
      toast.success(t.register.welcome);
      router.push(redirectTo);
    } catch (e) {
      setError(describeError(e, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-ligne bg-sur/60 p-7 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-normal">{t.register.title}</h1>
        <p className="text-[13px] text-txt3 mt-1">{t.register.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <Field
            label={t.register.usernameLabel}
            value={username}
            onChange={setUsername}
            placeholder={t.register.usernamePlaceholder}
            autoFocus
          />
          <p className="text-[11px] text-txt3 px-0.5">{t.register.usernameHint}</p>
        </div>
        <Field
          label={t.register.emailLabel}
          value={email}
          onChange={setEmail}
          type="email"
          placeholder={t.register.emailPlaceholder}
        />
        <div className="flex flex-col gap-1.5">
          <Field
            label={t.register.passwordLabel}
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="••••••••"
          />
          <PasswordRequirements password={password} />
        </div>

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
            {t.register.termsPrefix}{" "}
            <Link href="/cgu" target="_blank" className="text-vert hover:underline">
              {t.register.termsLink}
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
          {t.register.submit}
        </button>
      </form>

      <p className="text-center text-[13px] text-txt3">
        {t.register.haveAccount}{" "}
        <Link
          href={`/login${redirectTo !== "/app" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
          className="text-vert hover:underline"
        >
          {t.register.logIn}
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
  const t = useTranslations("auth");
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
            aria-label={visible ? t.hidePassword : t.showPassword}
            className="absolute right-0 top-0 h-full px-3 flex items-center text-txt3 hover:text-txt2 transition-colors"
          >
            {visible ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </label>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { authService } from "@/lib/services/auth.service";
import { ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import { Loader2, MailCheck } from "lucide-react";

export default function ForgetPasswordPage() {
  const t = useTranslations("auth").forgotPassword;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.forgetPassword(email);
      // Le backend renvoie toujours le même message, que le compte existe
      // ou non (anti-énumération) — on ne doit rien en déduire côté front.
      setSent(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t.genericError);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-ligne bg-sur/60 p-7 flex flex-col items-center gap-4 text-center">
        <div className="w-11 h-11 rounded-full bg-vert-t text-vert flex items-center justify-center">
          <MailCheck size={20} />
        </div>
        <div>
          <h1 className="font-display text-[20px] font-normal">{t.sentTitle}</h1>
          <p className="text-[13px] text-txt3 mt-1.5 max-w-[280px]">
            {t.sentBodyPrefix} <b className="text-txt2">{email}</b>
            {t.sentBodySuffix}
          </p>
        </div>

        <div className="w-full rounded-lg border border-ligne bg-sur2/60 px-3.5 py-3 text-left">
          <p className="text-[12px] text-txt3 leading-relaxed">
            {t.spamHint} <b className="text-txt2">{t.spamHintBold}</b> {t.spamHintSuffix}
          </p>
        </div>

        <Link href="/reinitialiser-mot-de-passe" className="text-[13px] text-vert hover:underline">
          {t.gotCode}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ligne bg-sur/60 p-7 flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[22px] font-normal">{t.title}</h1>
        <p className="text-[13px] text-txt3 mt-1">{t.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] text-txt3">{t.emailLabel}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="kofi@exemple.bj"
            autoFocus
            required
            className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
          />
        </label>

        {error && <p className="text-[12.5px] text-rouge">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex items-center justify-center gap-2 bg-vert text-[#05130c] font-medium text-[14px] rounded-lg py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
        >
          {loading && <Loader2 size={15} className="animate-spin" />}
          {t.submit}
        </button>
      </form>

      <p className="text-center text-[13px] text-txt3">
        <Link href="/login" className="text-vert hover:underline">
          {t.backToLogin}
        </Link>
      </p>
    </div>
  );
}
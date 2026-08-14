"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { userService } from "@/lib/services/user.service";
import { useAuthStore } from "@/lib/stores/auth.store";
import { toast } from "@/lib/stores/toast.store";
import { Spinner } from "@/components/ui/Primitives";
import { ApiError } from "@/lib/api/client";
import { useTranslations } from "@/lib/i18n/useTranslations";
import type { Messages } from "@/lib/i18n/messages/fr";
import { Loader2, TriangleAlert, Smartphone, HelpCircle } from "lucide-react";
import type { User } from "@/types";
import { InstallButton } from "@/components/features/InstallButton";
import { useOnboardingStore } from "@/lib/stores/onboarding.store";

export default function ProfilPage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setAuthUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const openOnboarding = useOnboardingStore((s) => s.open);

  const [user, setUser] = useState<User | null>(authUser);
  const [loading, setLoading] = useState(!authUser);

  useEffect(() => {
    userService
      .me()
      .then(setUser)
      .catch(() => toast.error(t.loadError))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-[13.5px] text-txt3 py-24 text-center">{t.loadFailed}</p>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-xl">
      <div>
        <h1 className="font-display text-[28px] font-normal">{t.title}</h1>
        <p className="text-[13.5px] text-txt3 mt-1">{t.subtitle}</p>
      </div>

      <ProfileForm
        user={user}
        t={t.info}
        onUpdated={(u) => {
          setUser(u);
          setAuthUser(u);
        }}
      />

      <PasswordForm t={t.password} />

      <div className="rounded-2xl border border-ligne bg-sur/60 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-txt3">
          <Smartphone size={16} />
          <h2 className="font-display text-[17px] font-normal text-txt">{t.mobileTitle}</h2>
        </div>
        <p className="text-[12.5px] text-txt3">{t.mobileText}</p>
        <InstallButton variant="panel" />
      </div>

      <div className="rounded-2xl border border-ligne bg-sur/60 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-txt3">
          <HelpCircle size={16} />
          <h2 className="font-display text-[17px] font-normal text-txt">{t.reminderTitle}</h2>
        </div>
        <p className="text-[12.5px] text-txt3">{t.reminderText}</p>
        <button
          onClick={() => openOnboarding()}
          className="self-start flex items-center gap-2 text-[13.5px] font-medium rounded-lg px-4 py-2.5 bg-sur2 border border-ligne text-txt2 hover:border-ligne2 transition-colors"
        >
          {t.reviewTour}
        </button>
      </div>

      <DangerZone
        t={t.dangerZone}
        onDeleted={() => {
          logout();
          toast.info(t.accountDeleted);
          router.replace("/login");
        }}
      />
    </div>
  );
}

// ─── Profil & préférences ──────────────────────────────────────────────────

function ProfileForm({
  user,
  onUpdated,
  t,
}: {
  user: User;
  onUpdated: (u: User) => void;
  t: Messages["profile"]["info"];
}) {
  const [username, setUsername] = useState(user.username);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? "");
  const [notifyByEmail, setNotifyByEmail] = useState(
    user.preferences?.notifyByEmail ?? true,
  );
  const [digestFrequency, setDigestFrequency] = useState(
    user.preferences?.digestFrequency ?? "weekly",
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateMe({
        username: username !== user.username ? username : undefined,
        avatarUrl: avatarUrl !== (user.avatarUrl ?? "") ? avatarUrl : undefined,
        preferences: { notifyByEmail, digestFrequency: digestFrequency as "daily" | "weekly" },
      });
      onUpdated(res.user);
      toast.success(t.updated);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.updateError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ligne bg-sur/60 p-6 flex flex-col gap-4"
    >
      <h2 className="font-display text-[17px] font-normal">{t.title}</h2>

      <Field label={t.username} value={username} onChange={setUsername} minLength={3} maxLength={20} />
      <Field label={t.email} value={user.email} onChange={() => {}} disabled />
      <Field
        label={t.avatar}
        value={avatarUrl}
        onChange={setAvatarUrl}
        placeholder={t.avatarPlaceholder}
        required={false}
      />

      <label className="flex items-center gap-2.5 text-[13px] text-txt2 mt-1">
        <input
          type="checkbox"
          checked={notifyByEmail}
          onChange={(e) => setNotifyByEmail(e.target.checked)}
          className="accent-vert w-4 h-4"
        />
        {t.emailNotifications}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-txt3">{t.digestFrequency}</span>
        <select
          value={digestFrequency}
          onChange={(e) => setDigestFrequency(e.target.value)}
          className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors"
        >
          <option value="daily">{t.digestDaily}</option>
          <option value="weekly">{t.digestWeekly}</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="mt-1 self-start flex items-center gap-2 bg-vert text-[#05130c] font-medium text-[13.5px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {t.save}
      </button>
    </form>
  );
}

// ─── Mot de passe ───────────────────────────────────────────────────────────

function PasswordForm({ t }: { t: Messages["profile"]["password"] }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      toast.success(t.success);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-ligne bg-sur/60 p-6 flex flex-col gap-4"
    >
      <h2 className="font-display text-[17px] font-normal">{t.title}</h2>
      <p className="text-[12.5px] text-txt3 -mt-2">{t.subtitle}</p>

      <Field
        label={t.current}
        value={currentPassword}
        onChange={setCurrentPassword}
        type="password"
      />
      <Field
        label={t.new}
        value={newPassword}
        onChange={setNewPassword}
        type="password"
        minLength={8}
      />

      <button
        type="submit"
        disabled={saving}
        className="mt-1 self-start flex items-center gap-2 bg-sur2 border border-ligne text-txt font-medium text-[13.5px] rounded-lg px-4 py-2.5 hover:border-ligne2 transition-all disabled:opacity-60"
      >
        {saving && <Loader2 size={14} className="animate-spin" />}
        {t.submit}
      </button>
    </form>
  );
}

// ─── Zone dangereuse ────────────────────────────────────────────────────────

function DangerZone({
  onDeleted,
  t,
}: {
  onDeleted: () => void;
  t: Messages["profile"]["dangerZone"];
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(t.confirm)) {
      return;
    }
    setDeleting(true);
    try {
      await userService.deleteMe();
      onDeleted();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.error);
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rouge/30 bg-rouge-t/40 p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-rouge">
        <TriangleAlert size={16} />
        <h2 className="font-display text-[17px] font-normal text-txt">{t.title}</h2>
      </div>
      <p className="text-[12.5px] text-txt3">{t.text}</p>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="mt-1 self-start flex items-center gap-2 bg-rouge/90 text-white font-medium text-[13.5px] rounded-lg px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-60"
      >
        {deleting && <Loader2 size={14} className="animate-spin" />}
        {t.submit}
      </button>
    </div>
  );
}

// ─── Champ générique ────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  required = true,
  minLength,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] text-txt3">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        className="bg-sur border border-ligne rounded-lg px-3.5 py-2.5 text-[13.5px] outline-none focus:border-vert/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </label>
  );
}
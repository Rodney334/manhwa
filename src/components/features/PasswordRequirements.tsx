"use client";

import { useTranslations } from "@/lib/i18n/useTranslations";
import { Check } from "lucide-react";

// Reflète exactement la règle du backend (routes/auth.ts) :
// `.isLength({ min: 8 })` + `/^(?=.*[A-Za-z])(?=.*\d).+$/` — 8 caractères,
// au moins une lettre, au moins un chiffre. Pas de symbole exigé : mieux
// vaut une checklist un peu courte mais fidèle à ce qui est réellement
// vérifié, plutôt qu'une règle de plus qui induirait en erreur (l'utilisateur
// croirait avoir besoin d'un symbole alors que le formulaire l'accepterait
// très bien sans).
export function checkPasswordRequirements(password: string) {
  return {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    digit: /\d/.test(password),
  };
}

export function isPasswordValid(password: string): boolean {
  const checks = checkPasswordRequirements(password);
  return checks.length && checks.letter && checks.digit;
}

export function PasswordRequirements({ password }: { password: string }) {
  const t = useTranslations("auth").passwordRequirements;
  const checks = checkPasswordRequirements(password);

  const items: { key: keyof typeof checks; label: string }[] = [
    { key: "length", label: t.length },
    { key: "letter", label: t.letter },
    { key: "digit", label: t.digit },
  ];

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const met = checks[item.key];
        return (
          <li
            key={item.key}
            className={`flex items-center gap-1.5 text-[11.5px] transition-colors ${
              met ? "text-vert" : "text-txt3"
            }`}
          >
            <span
              className={`flex items-center justify-center w-3.5 h-3.5 rounded-full border transition-colors shrink-0 ${
                met ? "bg-vert border-vert" : "border-ligne"
              }`}
            >
              {met && <Check size={9} className="text-[#05130c]" strokeWidth={3} />}
            </span>
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
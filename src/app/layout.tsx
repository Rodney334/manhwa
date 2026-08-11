import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono, Black_Han_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const blackHan = Black_Han_Sans({
  variable: "--font-blackhan",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ManhwaList — ne perdez plus jamais le fil",
    template: "%s | ManhwaList",
  },
  description:
    "Suivez votre progression sur tous vos manhwas, manwhas et webtoons en cours. Une seule bibliothèque, jamais deux fois le même chapitre.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${jakarta.variable} ${jetbrains.variable} ${blackHan.variable} antialiased`}
    >
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

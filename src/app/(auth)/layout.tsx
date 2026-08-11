import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-fond px-5 py-10 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-vert/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full bg-vert/[0.06] blur-[120px]"
      />

      <div className="relative z-10 w-full max-w-[400px] flex flex-col gap-8">
        <Link href="/" className="flex items-center justify-center gap-2.5 font-display text-[19px]">
          <i className="w-2 h-2 rounded-full bg-vert pastille-vive" />
          <b className="font-normal">
            Manhwa<span className="text-vert">List</span>
          </b>
        </Link>
        {children}
      </div>
    </div>
  );
}

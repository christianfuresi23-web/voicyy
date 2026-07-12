import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "./Wordmark";

const navigation = [
  { href: "#vantaggi", label: "Vantaggi" },
  { href: "#come-funziona", label: "Come funziona" },
  { href: "#configura", label: "Configura" },
  { href: "#scenari", label: "Scenari" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="site-shell flex h-[76px] items-center justify-between gap-6">
        <Wordmark />

        <nav
          aria-label="Navigazione principale"
          className="hidden items-center gap-1 rounded-full border border-black/8 bg-white/90 p-1.5 shadow-sm md:flex"
        >
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href="#configura"
          className="button button-dark min-h-10 px-4 text-sm sm:px-5"
        >
          <span className="hidden sm:inline">Crea il tuo agent</span>
          <span className="sm:hidden">Configura</span>
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={2} />
        </a>
      </div>
    </header>
  );
}

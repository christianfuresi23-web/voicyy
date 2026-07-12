import Image from "next/image";
import Link from "next/link";

type WordmarkProps = {
  className?: string;
  light?: boolean;
};

export function Wordmark({ className = "", light = false }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 focus-visible:ring-offset-4 ${className}`}
      aria-label="Voicyy — torna alla homepage"
    >
      <Image
        src="/voicyy-wordmark.svg"
        alt="Voicyy"
        width={164}
        height={48}
        priority
        className={light ? "h-auto w-[148px] invert" : "h-auto w-[164px]"}
      />
    </Link>
  );
}

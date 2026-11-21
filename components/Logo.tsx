import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-black">
        <svg width="16" height="16" viewBox="0 0 32 32" aria-hidden="true">
          <path d="M3 17h6l3-8 6 15 3-7h8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Pulsora
    </Link>
  );
}

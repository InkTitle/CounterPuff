import Link from "next/link";
import { X } from "lucide-react";

export function AuthPageClose() {
  return (
    <Link
      href="/"
      className="absolute right-3 top-3 rounded-full p-2 text-[var(--navy)] hover:bg-[var(--ice-2)]"
      aria-label="Close"
    >
      <X size={20} />
    </Link>
  );
}

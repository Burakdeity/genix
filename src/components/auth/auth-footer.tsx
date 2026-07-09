export function AuthFooter() {
  return (
    <footer className="flex w-full max-w-[1040px] flex-col items-center justify-between gap-4 px-6 py-4 text-sm text-[#444746] sm:flex-row">
      <button
        type="button"
        className="flex items-center gap-1 hover:underline"
      >
        Türkçe
        <span className="text-xs">▾</span>
      </button>
      <nav className="flex flex-wrap items-center justify-center gap-6">
        <a href="#" className="hover:underline">
          Yardım
        </a>
        <a href="#" className="hover:underline">
          Gizlilik
        </a>
        <a href="#" className="hover:underline">
          Şartlar
        </a>
      </nav>
    </footer>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-[10px] font-titulo text-[21px] font-bold tracking-[-0.01em] text-texto">
      <svg
        width="26"
        height="26"
        viewBox="0 0 26 26"
        aria-hidden="true"
        className="shrink-0 stroke-primaria"
      >
        <rect x="1.5" y="1.5" width="23" height="23" rx="5" fill="none" strokeWidth="2" />
        <path d="M6.5 9h13M6.5 13h13M6.5 17h7" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>Meu Financeiro</span>
    </span>
  );
}

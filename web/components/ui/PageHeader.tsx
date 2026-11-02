// Título de cada página (serif grande), con bajada y algo opcional a la derecha.
export function PageHeader({
  titulo,
  bajada,
  derecha,
}: {
  titulo: string;
  bajada?: React.ReactNode;
  derecha?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pt-8 pb-6 sm:pt-10 sm:pb-8">
      <div className="max-w-3xl">
        <h1 className="font-serif text-3xl font-medium tracking-tight text-fg sm:text-[2.6rem] sm:leading-tight">{titulo}</h1>
        {bajada && <p className="mt-3 text-[15px] leading-relaxed text-muted">{bajada}</p>}
      </div>
      {derecha}
    </header>
  );
}

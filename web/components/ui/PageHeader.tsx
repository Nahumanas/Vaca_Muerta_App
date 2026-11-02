// Título de cada página, con una bajada y algo opcional a la derecha.
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
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="text-xl font-semibold tracking-tight text-fg sm:text-2xl">{titulo}</h1>
        {bajada && <p className="mt-1 text-sm text-muted">{bajada}</p>}
      </div>
      {derecha}
    </header>
  );
}

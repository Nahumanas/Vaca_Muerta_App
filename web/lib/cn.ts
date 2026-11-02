// Junta clases de Tailwind y saltea las vacías: cn("a", cond && "b") -> "a b" o "a"
export const cn = (...clases: (string | false | null | undefined)[]) => clases.filter(Boolean).join(" ");

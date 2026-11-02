// Tarjeta con un número grande (como st.metric en Streamlit)
type Props = { titulo: string; valor: string; delta?: string; nota?: string };

export default function Metrica({ titulo, valor, delta, nota }: Props) {
  const negativo = delta?.startsWith("-");
  return (
    <div className="tarjeta metrica">
      <div className="metrica-titulo">{titulo}</div>
      <div className="metrica-valor">{valor}</div>
      {delta && <div className={`metrica-delta ${negativo ? "baja" : "sube"}`}>{negativo ? "▼" : "▲"} {delta}</div>}
      {nota && <div className="nota">{nota}</div>}
    </div>
  );
}

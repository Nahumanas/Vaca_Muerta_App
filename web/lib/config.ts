// Interruptores de la web.
//
// MOSTRAR_ML: la pestaña "Predicciones ML" queda guardada en el código pero OCULTA hasta que exista el modelo.
// Para activarla: en Vercel → Settings → Environment Variables, crear NEXT_PUBLIC_MOSTRAR_ML = true
// y volver a publicar (Redeploy). En tu PC: crear web/.env.local con la línea NEXT_PUBLIC_MOSTRAR_ML=true
export const MOSTRAR_ML = process.env.NEXT_PUBLIC_MOSTRAR_ML === "true";

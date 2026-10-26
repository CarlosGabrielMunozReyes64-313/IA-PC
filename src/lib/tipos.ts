// Formas de los datos que envía el backend del PC servidor (ver app.py en el servidor).

export interface Conversacion {
  id: string
  titulo: string
  creada: string
  actualizada: string
}

export interface Mensaje {
  id: number
  rol: 'user' | 'assistant'
  contenido: string
  pensamiento: string | null
  modelo: string | null
  tokens_por_segundo: number | null
  creado: string
}

export interface ConversacionCompleta extends Conversacion {
  mensajes: Mensaje[]
}

export interface Modelos {
  defecto: string
  modelos: { nombre: string; tamano_gb: number }[]
}

export interface Salud {
  ok: boolean
  ollama: boolean
}

/** Cada línea de la respuesta en vivo de POST /api/conversaciones/{id}/mensajes */
export type EventoRespuesta =
  | { tipo: 'pensamiento'; texto: string }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'fin'; mensaje_id: number | null; tokens_por_segundo: number | null }
  | { tipo: 'error'; mensaje: string }

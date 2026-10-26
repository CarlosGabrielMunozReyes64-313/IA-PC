// Comunicación con el backend que corre en el PC servidor.
import type {
  Conversacion, ConversacionCompleta, EventoRespuesta, Modelos, Salud,
} from './tipos'

/** Dirección del PC servidor. Se puede cambiar con la variable VITE_SERVIDOR_URL. */
export const SERVIDOR = (
  (import.meta.env.VITE_SERVIDOR_URL as string | undefined) || 'https://servidor-ia.tail9885b3.ts.net'
).replace(/\/+$/, '')

const SIN_CONEXION =
  'No se pudo conectar con tu PC. Revisa que esté encendido y conectado a internet.'

export class ErrorApi extends Error {
  estado: number
  constructor(estado: number, mensaje: string) {
    super(mensaje)
    this.estado = estado
  }
}

let token: string | null = null
let alVencer: () => void = () => {}

export function usarToken(nuevo: string | null) {
  token = nuevo
}

/** Qué hacer cuando el servidor dice que la sesión ya no vale. */
export function alVencerSesion(funcion: () => void) {
  alVencer = funcion
}

async function pedir(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  const cabeceras = new Headers(opciones.headers)
  if (token) cabeceras.set('Authorization', `Bearer ${token}`)
  if (opciones.body) cabeceras.set('Content-Type', 'application/json')

  let respuesta: Response
  try {
    respuesta = await fetch(SERVIDOR + ruta, { ...opciones, headers: cabeceras })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ErrorApi(0, SIN_CONEXION)
  }

  if (respuesta.ok) return respuesta
  if ([502, 503, 504].includes(respuesta.status)) throw new ErrorApi(respuesta.status, SIN_CONEXION)
  if (respuesta.status === 401 && token) alVencer()

  let detalle = `Tu PC respondió con un error (${respuesta.status}).`
  try {
    const cuerpo = await respuesta.json()
    if (typeof cuerpo.detail === 'string') detalle = cuerpo.detail
  } catch {
    // la respuesta no era JSON: se usa el mensaje genérico
  }
  throw new ErrorApi(respuesta.status, detalle)
}

async function pedirJson<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await pedir(ruta, opciones)
  return (await respuesta.json()) as T
}

export const api = {
  salud: () => pedirJson<Salud>('/api/salud'),

  entrar: (clave: string) =>
    pedirJson<{ token: string; expira: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ clave }),
    }),

  salir: () => pedirJson<{ ok: boolean }>('/api/logout', { method: 'POST' }),

  modelos: () => pedirJson<Modelos>('/api/modelos'),

  conversaciones: () => pedirJson<Conversacion[]>('/api/conversaciones'),

  crearConversacion: () => pedirJson<Conversacion>('/api/conversaciones', { method: 'POST' }),

  verConversacion: (id: string) =>
    pedirJson<ConversacionCompleta>(`/api/conversaciones/${encodeURIComponent(id)}`),

  borrarConversacion: (id: string) =>
    pedirJson<{ ok: boolean }>(`/api/conversaciones/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  /** Envía una pregunta y va entregando la respuesta pedazo a pedazo mientras se genera. */
  async enviarMensaje(
    id: string,
    cuerpo: { contenido: string; modelo?: string; pensar: boolean },
    alEvento: (evento: EventoRespuesta) => void,
    senal: AbortSignal,
  ): Promise<void> {
    const respuesta = await pedir(`/api/conversaciones/${encodeURIComponent(id)}/mensajes`, {
      method: 'POST',
      body: JSON.stringify(cuerpo),
      signal: senal,
    })
    if (!respuesta.body) throw new ErrorApi(0, 'Este navegador no puede mostrar respuestas en vivo.')

    const lector = respuesta.body.getReader()
    const decodificador = new TextDecoder()
    let pendiente = ''
    const procesar = (linea: string) => {
      if (!linea.trim()) return
      try {
        alEvento(JSON.parse(linea) as EventoRespuesta)
      } catch {
        // línea incompleta o dañada: se ignora
      }
    }

    try {
      for (;;) {
        const { done, value } = await lector.read()
        if (done) break
        pendiente += decodificador.decode(value, { stream: true })
        let salto: number
        while ((salto = pendiente.indexOf('\n')) >= 0) {
          procesar(pendiente.slice(0, salto))
          pendiente = pendiente.slice(salto + 1)
        }
      }
      procesar(pendiente)
    } catch (e) {
      if ((e as Error).name === 'AbortError') throw e
      throw new ErrorApi(0, 'Se cortó la conexión con tu PC mientras respondía.')
    }
  },
}

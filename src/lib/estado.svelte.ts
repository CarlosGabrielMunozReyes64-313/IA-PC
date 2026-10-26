// Estado compartido de toda la aplicación y las acciones que lo cambian.
import { api, alVencerSesion, ErrorApi, usarToken } from "./api";
import type { Conversacion, Mensaje, Modelos } from "./tipos";

/** Un mensaje en pantalla. Mientras se genera, todavía no tiene id del servidor. */
export interface MensajeEnPantalla {
  clave: string;
  rol: Mensaje["rol"];
  contenido: string;
  modelo: string | null;
  tokensPorSegundo: number | null;
  enCurso: boolean;
  aviso: string | null;
}

export type EstadoPC = "comprobando" | "en-linea" | "sin-ia" | "sin-conexion";

const CLAVES = {
  token: "ia-pc.token",
  pensar: "ia-pc.pensar",
  modelo: "ia-pc.modelo",
  sinApertura: "ia-pc.sin-apertura",
};

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function guardar(clave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    // almacenamiento no disponible (modo privado): se sigue sin guardar
  }
}

const APERTURA = "<think>";
const CIERRE = "</think>";

interface Separado {
  respuesta: string; // lo que se muestra
  pensando: boolean; // la IA todavía está razonando
  cerro: boolean; // apareció </think>: el razonamiento venía mezclado en el texto
}

/**
 * Separa el razonamiento de la respuesta cuando el servidor los manda mezclados en el texto.
 * Entiende "<think>razonamiento</think>respuesta", "razonamiento</think>respuesta" (modelos que
 * razonan sin etiqueta de apertura) y textos sin razonamiento.
 * - sinApertura: ya sabemos que el modelo razona sin <think>, así que todo es razonamiento
 *   hasta que llegue </think>.
 * - terminado: la respuesta llegó completa.
 */
export function separarRazonamiento(
  crudo: string,
  { sinApertura, terminado }: { sinApertura: boolean; terminado: boolean },
): Separado {
  const cierre = crudo.indexOf(CIERRE);
  if (cierre >= 0) {
    return {
      respuesta: crudo.slice(cierre + CIERRE.length).trimStart(),
      pensando: false,
      cerro: true,
    };
  }
  const inicio = crudo.trimStart();
  if (inicio.startsWith(APERTURA))
    return { respuesta: "", pensando: !terminado, cerro: false };
  if (!terminado && (APERTURA.startsWith(inicio) || sinApertura)) {
    return { respuesta: "", pensando: true, cerro: false };
  }
  let respuesta = inicio;
  if (!terminado) {
    // No mostrar un pedazo de "</think>" que todavía no termina de llegar
    for (let n = Math.min(CIERRE.length - 1, respuesta.length); n > 0; n--) {
      if (CIERRE.startsWith(respuesta.slice(-n))) {
        respuesta = respuesta.slice(0, -n);
        break;
      }
    }
  }
  return { respuesta, pensando: false, cerro: false };
}

/** Deja solo la respuesta final de un mensaje guardado (quita el razonamiento que tenga dentro). */
export function limpiarRespuesta(texto: string): string {
  return separarRazonamiento(texto, { sinApertura: false, terminado: true })
    .respuesta;
}

/** Modelos que razonan sin etiqueta de apertura (se aprende solo y se guarda en el navegador). */
function leerSinApertura(): string[] {
  const valor = leer(CLAVES.sinApertura);
  // qwen3:4b razona siempre y su razonamiento llega sin <think>: se conoce de antemano
  if (valor === null) return ["qwen3:4b"];
  try {
    const lista: unknown = JSON.parse(valor);
    return Array.isArray(lista)
      ? lista.filter((x): x is string => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function desdeServidor(m: Mensaje): MensajeEnPantalla {
  return {
    clave: `s${m.id}`,
    rol: m.rol,
    contenido:
      m.rol === "assistant" ? limpiarRespuesta(m.contenido) : m.contenido,
    modelo: m.modelo,
    tokensPorSegundo: m.tokens_por_segundo,
    enCurso: false,
    aviso: null,
  };
}

function mensajeDeError(e: unknown): string {
  return e instanceof ErrorApi
    ? e.message
    : "Ocurrió un error inesperado. Intenta de nuevo.";
}

function esFaltaDeConexion(e: unknown): boolean {
  return e instanceof ErrorApi && [0, 502, 503, 504].includes(e.estado);
}

let contador = 0;

class Estado {
  token = $state<string | null>(leer(CLAVES.token));
  pc = $state<EstadoPC>("comprobando");
  conversaciones = $state<Conversacion[]>([]);
  actualId = $state<string | null>(null);
  mensajes = $state<MensajeEnPantalla[]>([]);
  cargandoConversacion = $state(false);
  generando = $state(false);
  fase = $state<"pensando" | "escribiendo" | null>(null);
  modelos = $state<Modelos | null>(null);
  modelo = $state<string | null>(leer(CLAVES.modelo));
  pensar = $state(leer(CLAVES.pensar) === "si");
  aviso = $state<string | null>(null);
  avisoEntrada = $state<string | null>(null);

  #control: AbortController | null = null;
  #sinApertura = new Set<string>(leerSinApertura());

  actual = $derived(
    this.conversaciones.find((c) => c.id === this.actualId) ?? null,
  );

  constructor() {
    usarToken(this.token);
    alVencerSesion(() =>
      this.#cerrarSesionLocal(
        "La sesión venció. Vuelve a entrar con tu contraseña.",
      ),
    );
  }

  async comprobarPC() {
    try {
      const salud = await api.salud();
      this.pc = salud.ollama ? "en-linea" : "sin-ia";
    } catch {
      this.pc = "sin-conexion";
    }
  }

  async entrar(clave: string): Promise<boolean> {
    this.avisoEntrada = null;
    try {
      const { token } = await api.entrar(clave);
      this.token = token;
      usarToken(token);
      guardar(CLAVES.token, token);
      this.pc = "en-linea";
      await this.cargarInicio();
      return true;
    } catch (e) {
      if (esFaltaDeConexion(e)) {
        this.pc = "sin-conexion";
        this.avisoEntrada = "No se pudo entrar porque tu PC no responde.";
      } else {
        this.avisoEntrada = mensajeDeError(e);
      }
      return false;
    }
  }

  async salir() {
    this.detener();
    try {
      await api.salir();
    } catch {
      // aunque el PC no responda, la sesión se cierra en este dispositivo
    }
    this.#cerrarSesionLocal(null);
  }

  #cerrarSesionLocal(motivo: string | null) {
    this.#control?.abort();
    this.token = null;
    usarToken(null);
    guardar(CLAVES.token, null);
    this.conversaciones = [];
    this.actualId = null;
    this.mensajes = [];
    this.avisoEntrada = motivo;
  }

  async cargarInicio() {
    try {
      const [lista, modelos] = await Promise.all([
        api.conversaciones(),
        api.modelos(),
      ]);
      this.conversaciones = lista;
      this.modelos = modelos;
      const disponibles = modelos.modelos.map((m) => m.nombre);
      if (!this.modelo || !disponibles.includes(this.modelo))
        this.modelo = modelos.defecto;
      this.pc = "en-linea";
    } catch (e) {
      this.aviso = mensajeDeError(e);
      if (esFaltaDeConexion(e)) this.pc = "sin-conexion";
    }
  }

  async actualizarLista() {
    try {
      this.conversaciones = await api.conversaciones();
    } catch {
      // se reintenta en la siguiente acción
    }
  }

  async abrir(id: string) {
    if (id === this.actualId) return;
    this.detener();
    this.actualId = id;
    this.mensajes = [];
    this.aviso = null;
    this.cargandoConversacion = true;
    try {
      const conversacion = await api.verConversacion(id);
      for (const m of conversacion.mensajes) {
        const crudo = m.contenido.trimStart();
        if (
          m.rol === "assistant" &&
          m.modelo &&
          crudo.includes(CIERRE) &&
          !crudo.startsWith(APERTURA)
        ) {
          this.#recordarSinApertura(m.modelo, true);
        }
      }
      if (this.actualId === id)
        this.mensajes = conversacion.mensajes.map(desdeServidor);
    } catch (e) {
      this.aviso = mensajeDeError(e);
      if (esFaltaDeConexion(e)) this.pc = "sin-conexion";
    } finally {
      this.cargandoConversacion = false;
    }
  }

  nueva() {
    this.detener();
    this.actualId = null;
    this.mensajes = [];
    this.aviso = null;
  }

  async borrar(id: string) {
    try {
      await api.borrarConversacion(id);
      this.conversaciones = this.conversaciones.filter((c) => c.id !== id);
      if (this.actualId === id) this.nueva();
    } catch (e) {
      this.aviso = mensajeDeError(e);
    }
  }

  cambiarPensar(valor: boolean) {
    this.pensar = valor;
    guardar(CLAVES.pensar, valor ? "si" : "no");
  }

  cambiarModelo(nombre: string) {
    this.modelo = nombre;
    guardar(CLAVES.modelo, nombre);
  }

  detener() {
    this.#control?.abort();
  }

  #recordarSinApertura(modelo: string, razonaSinApertura: boolean) {
    if (!modelo || razonaSinApertura === this.#sinApertura.has(modelo)) return;
    if (razonaSinApertura) this.#sinApertura.add(modelo);
    else this.#sinApertura.delete(modelo);
    guardar(CLAVES.sinApertura, JSON.stringify([...this.#sinApertura]));
  }

  async enviar(texto: string) {
    const contenido = texto.trim();
    if (!contenido || this.generando) return;
    this.aviso = null;
    this.generando = true;
    this.fase = "pensando";

    this.mensajes.push({
      clave: `l${++contador}`,
      rol: "user",
      contenido,
      modelo: null,
      tokensPorSegundo: null,
      enCurso: false,
      aviso: null,
    });
    this.mensajes.push({
      clave: `l${++contador}`,
      rol: "assistant",
      contenido: "",
      modelo: this.modelo,
      tokensPorSegundo: null,
      enCurso: true,
      aviso: null,
    });
    // Se toma el objeto ya convertido en reactivo para que los cambios se vean en pantalla
    const respuesta = this.mensajes[this.mensajes.length - 1];

    const control = new AbortController();
    this.#control = control;

    // El texto llega con el razonamiento mezclado: se guarda completo aquí y en pantalla
    // se muestra solo la respuesta
    const modeloUsado = this.modelo ?? this.modelos?.defecto ?? "";
    let crudo = "";
    let razonamientoAparte = false; // el servidor mandó el razonamiento por separado
    let terminoBien = false;
    const mostrar = (terminado: boolean) => {
      const separado = separarRazonamiento(crudo, {
        sinApertura: !razonamientoAparte && this.#sinApertura.has(modeloUsado),
        terminado,
      });
      respuesta.contenido = separado.respuesta;
      this.fase = separado.respuesta ? "escribiendo" : "pensando";
      return separado;
    };

    try {
      let id = this.actualId;
      if (!id) {
        const conversacion = await api.crearConversacion();
        id = conversacion.id;
        this.actualId = id;
        this.conversaciones.unshift(conversacion);
      }
      // Mostrar de inmediato el título y subir la conversación al principio de la lista
      // (el servidor hace lo mismo: el título son los primeros 60 caracteres)
      const posicion = this.conversaciones.findIndex((c) => c.id === id);
      if (posicion >= 0) {
        const [conversacion] = this.conversaciones.splice(posicion, 1);
        if (conversacion.titulo === "Nueva conversación") {
          conversacion.titulo = contenido.split(/\s+/).join(" ").slice(0, 60);
        }
        this.conversaciones.unshift(conversacion);
      }
      this.pc = "en-linea";
      await api.enviarMensaje(
        id,
        {
          contenido,
          pensar: this.pensar,
          ...(this.modelo ? { modelo: this.modelo } : {}),
        },
        (evento) => {
          if (evento.tipo === "pensamiento") {
            // El razonamiento no se muestra: solo se indica que la IA está pensando
            razonamientoAparte = true;
            if (!respuesta.contenido) this.fase = "pensando";
          } else if (evento.tipo === "texto") {
            crudo += evento.texto;
            if (mostrar(false).cerro && !razonamientoAparte)
              this.#recordarSinApertura(modeloUsado, true);
          } else if (evento.tipo === "fin") {
            respuesta.tokensPorSegundo = evento.tokens_por_segundo;
            respuesta.modelo ??= this.modelos?.defecto ?? null;
          } else if (evento.tipo === "error") {
            respuesta.aviso = evento.mensaje;
          }
        },
        control.signal,
      );
      terminoBien = !respuesta.aviso;
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        respuesta.aviso = respuesta.contenido
          ? "Detuviste la respuesta. Se guardó lo que alcanzó a escribir."
          : "Detuviste la respuesta antes de que empezara a escribirla.";
      } else {
        respuesta.aviso = mensajeDeError(e);
        if (esFaltaDeConexion(e)) this.pc = "sin-conexion";
      }
    } finally {
      // Si se detuvo a mitad del razonamiento, lo que llegó sigue siendo razonamiento: no se muestra
      const final = mostrar(terminoBien);
      if (terminoBien && crudo && !razonamientoAparte) {
        // Se corrige solo: un modelo que respondió completo sin </think> ya no se marca
        this.#recordarSinApertura(modeloUsado, final.cerro);
      }
      if (!respuesta.contenido && !respuesta.aviso) {
        respuesta.aviso =
          "La IA terminó sin escribir una respuesta. Intenta preguntar de nuevo.";
      }
      respuesta.enCurso = false;
      this.generando = false;
      this.fase = null;
      if (this.#control === control) this.#control = null;
      void this.actualizarLista();
    }
  }
}

export const estado = new Estado();

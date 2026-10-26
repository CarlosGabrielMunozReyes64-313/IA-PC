// Convierte el Markdown que escribe la IA (listas, negritas, código, tablas...) en HTML.
// Es seguro: todo el texto se escapa antes de agregar etiquetas, así que la respuesta
// nunca puede inyectar HTML ni scripts en la página. Funciona también con texto a medias
// mientras la respuesta todavía se está generando.

function escapar(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Formato dentro de una línea. Recibe texto ya escapado. */
function enLinea(texto: string): string {
  return texto
    .split(/(`[^`]+`)/g)
    .map((parte) => {
      if (parte.length > 2 && parte.startsWith('`') && parte.endsWith('`')) {
        return `<code>${parte.slice(1, -1)}</code>`
      }
      return parte
        .replace(/\*\*(\S(?:.*?\S)?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[\s(])\*(\S(?:[^*]*?\S)?)\*(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>')
        .replace(
          /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
        )
    })
    .join('')
}

const formato = (texto: string) => enLinea(escapar(texto))

const VINETA = /^\s*[-*+]\s+/
const NUMERO = /^\s*(\d+)[.)]\s+/
const CERCA = /^\s*```/
const FILA_TABLA = /^\s*\|.*\|\s*$/
const SEPARADOR_TABLA = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/

function celdas(fila: string): string[] {
  return fila.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
}

export function markdown(texto: string): string {
  const lineas = texto.replace(/\r\n?/g, '\n').split('\n')
  const salida: string[] = []
  let parrafo: string[] = []
  let i = 0

  const cerrarParrafo = () => {
    if (parrafo.length) {
      salida.push(`<p>${parrafo.map(formato).join('<br>')}</p>`)
      parrafo = []
    }
  }

  while (i < lineas.length) {
    const linea = lineas[i]

    // Bloque de código ``` (si no se ha cerrado todavía, toma el resto del texto)
    if (CERCA.test(linea)) {
      cerrarParrafo()
      const codigo: string[] = []
      i++
      while (i < lineas.length && !CERCA.test(lineas[i])) codigo.push(lineas[i++])
      i++
      salida.push(`<pre><code>${escapar(codigo.join('\n'))}</code></pre>`)
      continue
    }

    // Títulos: # se muestra como h3 para que no compitan con la interfaz
    const titulo = linea.match(/^(#{1,4})\s+(.*)$/)
    if (titulo) {
      cerrarParrafo()
      const nivel = Math.min(titulo[1].length + 2, 6)
      salida.push(`<h${nivel}>${formato(titulo[2])}</h${nivel}>`)
      i++
      continue
    }

    // Tablas
    if (FILA_TABLA.test(linea) && i + 1 < lineas.length && SEPARADOR_TABLA.test(lineas[i + 1])) {
      cerrarParrafo()
      const encabezado = celdas(linea)
      i += 2
      const filas: string[][] = []
      while (i < lineas.length && FILA_TABLA.test(lineas[i])) filas.push(celdas(lineas[i++]))
      salida.push(
        '<div class="tabla"><table><thead><tr>' +
          encabezado.map((c) => `<th>${formato(c)}</th>`).join('') +
          '</tr></thead><tbody>' +
          filas.map((f) => '<tr>' + f.map((c) => `<td>${formato(c)}</td>`).join('') + '</tr>').join('') +
          '</tbody></table></div>',
      )
      continue
    }

    // Listas con viñetas o numeradas
    const numerada = NUMERO.test(linea)
    if (numerada || VINETA.test(linea)) {
      cerrarParrafo()
      const patron = numerada ? NUMERO : VINETA
      const inicio = numerada ? Number(linea.match(NUMERO)![1]) : 1
      const elementos: string[] = []
      while (i < lineas.length && patron.test(lineas[i])) {
        let elemento = lineas[i++].replace(patron, '')
        // líneas siguientes con sangría pertenecen al mismo elemento
        while (i < lineas.length && /^\s{2,}\S/.test(lineas[i]) && !VINETA.test(lineas[i]) && !NUMERO.test(lineas[i])) {
          elemento += '\n' + lineas[i++].trim()
        }
        elementos.push(`<li>${elemento.split('\n').map(formato).join('<br>')}</li>`)
      }
      const etiqueta = numerada ? 'ol' : 'ul'
      const atributo = numerada && inicio !== 1 ? ` start="${inicio}"` : ''
      salida.push(`<${etiqueta}${atributo}>${elementos.join('')}</${etiqueta}>`)
      continue
    }

    // Citas
    if (/^\s*>/.test(linea)) {
      cerrarParrafo()
      const cita: string[] = []
      while (i < lineas.length && /^\s*>/.test(lineas[i])) cita.push(lineas[i++].replace(/^\s*>\s?/, ''))
      salida.push(`<blockquote>${cita.map(formato).join('<br>')}</blockquote>`)
      continue
    }

    // Línea separadora
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(linea)) {
      cerrarParrafo()
      salida.push('<hr>')
      i++
      continue
    }

    if (linea.trim() === '') {
      cerrarParrafo()
    } else {
      parrafo.push(linea)
    }
    i++
  }
  cerrarParrafo()
  return salida.join('')
}

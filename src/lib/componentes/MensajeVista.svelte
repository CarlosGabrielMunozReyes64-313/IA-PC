<script lang="ts">
  import { estado, type MensajeEnPantalla } from '../estado.svelte'
  import { markdown } from '../markdown'

  let { mensaje }: { mensaje: MensajeEnPantalla } = $props()

  let copiado = $state(false)
  let segundos = $state(0)
  const inicio = Date.now()

  const CURSOR = '<span class="cursor-ia" aria-hidden="true"></span>'

  // Mientras no haya texto de respuesta, se muestra la animación de carga
  const cargando = $derived(mensaje.enCurso && !mensaje.contenido.trim())

  // El cursor se mete dentro del último párrafo para que quede pegado al texto
  const html = $derived.by(() => {
    const base = markdown(mensaje.contenido)
    if (!mensaje.enCurso) return base
    if (base.endsWith('</p>')) return base.slice(0, -4) + CURSOR + '</p>'
    if (base.endsWith('</li></ul>') || base.endsWith('</li></ol>')) {
      return base.slice(0, -10) + CURSOR + base.slice(-10)
    }
    return base + `<p>${CURSOR}</p>`
  })

  const velocidad = $derived(
    mensaje.tokensPorSegundo
      ? `${mensaje.tokensPorSegundo.toLocaleString('es', { maximumFractionDigits: 1 })} tokens por segundo`
      : null,
  )

  // Cuenta los segundos de espera para que se note que el PC sigue trabajando
  $effect(() => {
    if (!cargando) return
    const reloj = setInterval(() => (segundos = Math.floor((Date.now() - inicio) / 1000)), 1000)
    return () => clearInterval(reloj)
  })

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensaje.contenido)
      copiado = true
      setTimeout(() => (copiado = false), 1800)
    } catch {
      // el navegador no permitió copiar
    }
  }
</script>

{#if mensaje.rol === 'user'}
  <div class="tu">
    <p>{mensaje.contenido}</p>
  </div>
{:else}
  <article class="ia" aria-busy={mensaje.enCurso}>
    {#if cargando}
      <div class="cargando" role="status">
        <span class="bloques" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>{estado.fase === 'escribiendo' ? 'Escribiendo' : 'Pensando'}</span>
        {#if segundos >= 3}<span class="tiempo">{segundos} s</span>{/if}
      </div>
    {:else if mensaje.contenido}
      <div class="contenido">{@html html}</div>
    {/if}

    {#if mensaje.aviso}
      <p class="aviso" role="alert">{mensaje.aviso}</p>
    {/if}

    {#if !mensaje.enCurso && mensaje.contenido}
      <div class="datos">
        {#if mensaje.modelo}<span>{mensaje.modelo}</span>{/if}
        {#if velocidad}<span>{velocidad}</span>{/if}
        <button onclick={copiar}>{copiado ? 'Copiado' : 'Copiar'}</button>
      </div>
    {/if}
  </article>
{/if}

<style>
  .tu {
    align-self: flex-end;
    max-width: min(34rem, 88%);
    background: var(--ambar);
    color: var(--ambar-tinta);
    padding: 0.7rem 1rem;
    border-radius: 1.1rem 1.1rem 0.35rem 1.1rem;
  }
  .tu p {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .ia {
    align-self: stretch;
    border-left: 2px solid var(--verde);
    padding-left: var(--espacio-4);
  }

  /* Animación de carga: tres bloques verdes que se encienden en orden, como un cursor de terminal */
  .cargando {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-height: 1.8rem;
    color: var(--tinta-suave);
    font-size: 0.9375rem;
  }
  .bloques {
    display: inline-flex;
    gap: 0.28rem;
  }
  .bloques i {
    width: 0.55rem;
    height: 1.05rem;
    border-radius: 1.5px;
    background: var(--verde);
    opacity: 0.2;
    animation: encender 1.2s ease-in-out infinite;
  }
  .bloques i:nth-child(2) {
    animation-delay: 0.2s;
  }
  .bloques i:nth-child(3) {
    animation-delay: 0.4s;
  }
  @keyframes encender {
    0%, 100% { opacity: 0.2; }
    30% { opacity: 1; }
  }
  .tiempo {
    font-variant-numeric: tabular-nums;
  }

  .contenido {
    font-family: var(--letra-lectura);
    font-size: 1.0625rem;
    line-height: 1.68;
    max-width: 68ch;
    overflow-wrap: anywhere;
  }
  .contenido :global(p) {
    margin: 0 0 0.85em;
  }
  .contenido :global(:last-child) {
    margin-bottom: 0;
  }
  .contenido :global(h3),
  .contenido :global(h4),
  .contenido :global(h5),
  .contenido :global(h6) {
    font-family: var(--letra-interfaz);
    line-height: 1.3;
    margin: 1.3em 0 0.5em;
  }
  .contenido :global(h3) { font-size: 1.25rem; }
  .contenido :global(h4) { font-size: 1.125rem; }
  .contenido :global(h5),
  .contenido :global(h6) { font-size: 1rem; }
  .contenido :global(ul),
  .contenido :global(ol) {
    margin: 0 0 0.85em;
    padding-left: 1.4em;
  }
  .contenido :global(li) {
    margin-bottom: 0.3em;
  }
  .contenido :global(li::marker) {
    color: var(--verde);
  }
  .contenido :global(code) {
    font-family: var(--letra-codigo);
    font-size: 0.875em;
    background: var(--codigo-fondo);
    padding: 0.1em 0.35em;
    border-radius: 4px;
  }
  .contenido :global(pre) {
    background: var(--codigo-fondo);
    padding: 0.85rem 1rem;
    border-radius: 8px;
    overflow-x: auto;
    margin: 0 0 0.85em;
    line-height: 1.5;
  }
  .contenido :global(pre code) {
    background: none;
    padding: 0;
    font-size: 0.875rem;
  }
  .contenido :global(blockquote) {
    margin: 0 0 0.85em;
    padding-left: 1rem;
    border-left: 3px solid var(--borde);
    color: var(--tinta-suave);
  }
  .contenido :global(hr) {
    border: none;
    border-top: 1px solid var(--borde);
    margin: 1.2em 0;
  }
  .contenido :global(a) {
    color: var(--verde);
    text-underline-offset: 2px;
  }
  .contenido :global(.tabla) {
    overflow-x: auto;
    margin: 0 0 0.85em;
  }
  .contenido :global(table) {
    border-collapse: collapse;
    font-family: var(--letra-interfaz);
    font-size: 0.9375rem;
  }
  .contenido :global(th),
  .contenido :global(td) {
    text-align: left;
    padding: 0.4rem 0.8rem 0.4rem 0;
    border-bottom: 1px solid var(--borde-suave);
    vertical-align: top;
  }
  .contenido :global(th) {
    border-bottom: 1.5px solid var(--borde);
  }
  .contenido :global(.cursor-ia) {
    display: inline-block;
    width: 0.55em;
    height: 1.05em;
    margin-left: 0.12em;
    vertical-align: -0.17em;
    background: var(--verde);
    border-radius: 1.5px;
    animation: parpadeo 1.1s steps(1) infinite;
  }

  .aviso {
    margin: var(--espacio-2) 0 0;
    color: var(--ambar-fuerte);
    font-size: 0.9375rem;
    font-weight: 600;
  }

  .datos {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.25rem 1.1rem;
    margin-top: var(--espacio-2);
    font-size: 0.8125rem;
    color: var(--tinta-suave);
  }
  .datos button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0.2rem 0;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .datos button:hover {
    color: var(--tinta);
  }
  .datos button:focus-visible {
    outline: 3px solid var(--foco);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .bloques i {
      animation: none;
      opacity: 0.6;
    }
    .contenido :global(.cursor-ia) {
      animation: none;
    }
  }
</style>

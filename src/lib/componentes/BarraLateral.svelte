<script lang="ts">
  import { estado } from '../estado.svelte'
  import type { Conversacion } from '../tipos'
  import Icono from './Icono.svelte'

  let { abierta, onCerrar }: { abierta: boolean; onCerrar: () => void } = $props()

  function nueva() {
    estado.nueva()
    onCerrar()
  }

  function abrir(c: Conversacion) {
    void estado.abrir(c.id)
    onCerrar()
  }

  function borrar(c: Conversacion) {
    if (confirm(`¿Borrar "${c.titulo}"? Se elimina también del disco de tu PC.`)) {
      void estado.borrar(c.id)
    }
  }

  function cuando(fecha: string): string {
    const d = new Date(fecha)
    const hoy = new Date()
    if (d.toDateString() === hoy.toDateString()) {
      return d.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit' })
    }
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
  }
</script>

<aside class="barra" class:abierta aria-label="Conversaciones">
  <div class="cabecera">
    <span class="marca">Aya</span>
    <button class="icono solo-movil" onclick={onCerrar} aria-label="Cerrar la lista">
      <Icono nombre="cerrar" />
    </button>
  </div>

  <button class="nueva" onclick={nueva}>
    <Icono nombre="mas" tamano={18} />
    Nueva conversación
  </button>

  <nav class="lista">
    {#if estado.conversaciones.length === 0}
      <p class="vacio">Tus conversaciones aparecerán aquí y quedan guardadas en tu PC.</p>
    {/if}
    <ul>
      {#each estado.conversaciones as c (c.id)}
        <li class:actual={c.id === estado.actualId}>
          <button class="abrir" onclick={() => abrir(c)} aria-current={c.id === estado.actualId ? 'page' : undefined}>
            <span class="titulo">{c.titulo}</span>
            <span class="fecha">{cuando(c.actualizada)}</span>
          </button>
          <button class="icono borrar" onclick={() => borrar(c)} aria-label={`Borrar ${c.titulo}`}>
            <Icono nombre="papelera" tamano={17} />
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <button class="salir" onclick={() => estado.salir()}>
    <Icono nombre="salir" tamano={18} />
    Cerrar sesión
  </button>
</aside>

<style>
  .barra {
    display: flex;
    flex-direction: column;
    gap: var(--espacio-3);
    padding: var(--espacio-4) var(--espacio-3);
    background: var(--barra);
    border-right: 1px solid var(--borde-suave);
    min-height: 0;
  }
  .cabecera {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--espacio-2);
    min-height: 2.25rem;
  }
  .marca {
    font-weight: 750;
    font-size: 1.25rem;
    letter-spacing: -0.01em;
  }
  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 3px solid var(--foco);
    outline-offset: -1px;
  }
  .icono {
    display: grid;
    place-items: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: var(--radio-control);
    color: var(--tinta-suave);
  }
  .icono:hover {
    background: var(--resalte);
    color: var(--tinta);
  }
  .nueva {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 0.75rem;
    border-radius: var(--radio-control);
    border: 1.5px solid var(--borde);
    font-weight: 650;
    background: var(--superficie);
  }
  .nueva:hover {
    border-color: var(--tinta);
  }
  .lista {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0 calc(-1 * var(--espacio-3));
    padding: 0 var(--espacio-3);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 2px;
  }
  li {
    position: relative;
    display: flex;
    align-items: center;
    border-radius: var(--radio-control);
  }
  li:hover,
  li.actual {
    background: var(--resalte);
  }
  li.actual::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.55rem;
    bottom: 0.55rem;
    width: 3px;
    border-radius: 2px;
    background: var(--verde);
  }
  .abrir {
    flex: 1;
    min-width: 0;
    display: grid;
    text-align: left;
    padding: 0.55rem 0.4rem 0.55rem 0.8rem;
    border-radius: var(--radio-control);
  }
  .titulo {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .fecha {
    font-size: 0.8125rem;
    color: var(--tinta-suave);
  }
  .borrar {
    flex: none;
    opacity: 0;
  }
  li:hover .borrar,
  li:focus-within .borrar {
    opacity: 1;
  }
  @media (hover: none) {
    .borrar {
      opacity: 1;
    }
  }
  .vacio {
    color: var(--tinta-suave);
    font-size: 0.9375rem;
    padding: 0 var(--espacio-2);
  }
  .salir {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 0.75rem;
    border-radius: var(--radio-control);
    color: var(--tinta-suave);
  }
  .salir:hover {
    background: var(--resalte);
    color: var(--tinta);
  }
  .solo-movil {
    display: none;
  }

  @media (max-width: 760px) {
    .barra {
      position: fixed;
      inset: 0 auto 0 0;
      width: min(19rem, 86vw);
      z-index: 20;
      transform: translateX(-100%);
      transition: transform 0.22s ease;
      padding-top: calc(var(--espacio-4) + env(safe-area-inset-top, 0px));
      padding-bottom: calc(var(--espacio-4) + env(safe-area-inset-bottom, 0px));
    }
    .barra.abierta {
      transform: none;
    }
    .solo-movil {
      display: grid;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .barra {
      transition: none;
    }
  }
</style>

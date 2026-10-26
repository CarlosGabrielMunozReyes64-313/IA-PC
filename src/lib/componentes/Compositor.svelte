<script lang="ts">
  import { estado } from '../estado.svelte'
  import Icono from './Icono.svelte'

  let texto = $state('')
  let caja: HTMLTextAreaElement | undefined = $state()

  // En celulares, Enter hace salto de línea y se envía con el botón
  const pantallaTactil = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches

  function ajustarAltura() {
    if (!caja) return
    caja.style.height = 'auto'
    caja.style.height = `${Math.min(caja.scrollHeight, 220)}px`
  }

  function enviar() {
    if (!texto.trim() || estado.generando) return
    void estado.enviar(texto)
    texto = ''
    queueMicrotask(ajustarAltura)
  }

  function alPresionar(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && !pantallaTactil && !e.isComposing) {
      e.preventDefault()
      enviar()
    }
  }

  export function enfocar() {
    caja?.focus()
  }
</script>

<div class="compositor">
  <div class="caja" class:activa={estado.generando}>
    <label class="oculto" for="pregunta">Pregunta para Aya</label>
    <textarea
      id="pregunta"
      bind:this={caja}
      bind:value={texto}
      oninput={ajustarAltura}
      onkeydown={alPresionar}
      rows="1"
      placeholder="Escribe tu pregunta"
      enterkeyhint={pantallaTactil ? 'enter' : 'send'}
    ></textarea>
    {#if estado.generando}
      <button class="accion detener" onclick={() => estado.detener()} aria-label="Detener la respuesta">
        <Icono nombre="detener" />
      </button>
    {:else}
      <button class="accion" onclick={enviar} disabled={!texto.trim()} aria-label="Enviar pregunta">
        <Icono nombre="enviar" />
      </button>
    {/if}
  </div>

  <div class="opciones">
    <label class="interruptor">
      <input
        type="checkbox"
        checked={estado.pensar}
        onchange={(e) => estado.cambiarPensar(e.currentTarget.checked)}
      />
      <span class="pista" aria-hidden="true"></span>
      Razonar antes de responder
    </label>

    {#if estado.modelos && estado.modelos.modelos.length > 1}
      <label class="modelo">
        <span>Modelo</span>
        <select
          value={estado.modelo}
          onchange={(e) => estado.cambiarModelo(e.currentTarget.value)}
          disabled={estado.generando}
        >
          {#each estado.modelos.modelos as m (m.nombre)}
            <option value={m.nombre}>{m.nombre}</option>
          {/each}
        </select>
      </label>
    {/if}
  </div>
</div>

<style>
  .compositor {
    display: grid;
    gap: var(--espacio-2);
  }
  .caja {
    display: flex;
    align-items: flex-end;
    gap: var(--espacio-2);
    background: var(--superficie);
    border: 1.5px solid var(--borde);
    border-radius: 1.4rem;
    padding: 0.4rem 0.4rem 0.4rem 1.1rem;
  }
  .caja:focus-within {
    border-color: var(--tinta);
    box-shadow: 0 0 0 3px var(--foco);
  }
  textarea {
    flex: 1;
    min-width: 0;
    font: inherit;
    font-size: 1.0625rem;
    line-height: 1.5;
    color: var(--tinta);
    background: none;
    border: none;
    resize: none;
    padding: 0.5rem 0;
    max-height: 220px;
  }
  textarea:focus {
    outline: none;
  }
  textarea::placeholder {
    color: var(--tinta-suave);
  }
  .accion {
    flex: none;
    display: grid;
    place-items: center;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    border: none;
    background: var(--tinta);
    color: var(--papel);
    cursor: pointer;
  }
  .accion:disabled {
    opacity: 0.3;
    cursor: default;
  }
  .accion.detener {
    background: var(--ambar-fuerte);
    color: #fff;
  }
  .accion:focus-visible {
    outline: 3px solid var(--foco);
    outline-offset: 2px;
  }

  .opciones {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--espacio-2) var(--espacio-4);
    padding: 0 var(--espacio-2);
    font-size: 0.875rem;
    color: var(--tinta-suave);
  }
  .interruptor {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    cursor: pointer;
  }
  .interruptor input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
  }
  .pista {
    position: relative;
    width: 2.1rem;
    height: 1.2rem;
    border-radius: 1rem;
    background: var(--borde);
    transition: background 0.15s;
  }
  .pista::after {
    content: '';
    position: absolute;
    top: 0.15rem;
    left: 0.15rem;
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 50%;
    background: var(--superficie);
    transition: transform 0.15s;
  }
  .interruptor input:checked + .pista {
    background: var(--morado);
  }
  .interruptor input:checked + .pista::after {
    transform: translateX(0.9rem);
  }
  .interruptor input:focus-visible + .pista {
    outline: 3px solid var(--foco);
    outline-offset: 2px;
  }
  .modelo {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
  }
  select {
    font: inherit;
    color: var(--tinta);
    background: var(--superficie);
    border: 1px solid var(--borde);
    border-radius: 6px;
    padding: 0.2rem 0.4rem;
  }
  select:focus-visible {
    outline: 3px solid var(--foco);
  }
  .oculto {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  @media (prefers-reduced-motion: reduce) {
    .pista,
    .pista::after {
      transition: none;
    }
  }
</style>

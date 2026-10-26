<script lang="ts">
  import { onMount } from 'svelte'
  import { estado } from './lib/estado.svelte'
  import BarraLateral from './lib/componentes/BarraLateral.svelte'
  import Chat from './lib/componentes/Chat.svelte'
  import Entrada from './lib/componentes/Entrada.svelte'

  let listaAbierta = $state(false)

  onMount(() => {
    void estado.comprobarPC()
    if (estado.token) void estado.cargarInicio()

    // Revisar cada 30 segundos si el PC sigue disponible (solo con la pestaña visible)
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible' && !estado.generando) void estado.comprobarPC()
    }, 30_000)
    const alVolver = () => {
      if (document.visibilityState === 'visible') void estado.comprobarPC()
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
    }
  })

  function alTeclear(e: KeyboardEvent) {
    if (e.key === 'Escape' && listaAbierta) listaAbierta = false
  }
</script>

<svelte:window onkeydown={alTeclear} />

{#if estado.token}
  <div class="aplicacion">
    <BarraLateral abierta={listaAbierta} onCerrar={() => (listaAbierta = false)} />
    {#if listaAbierta}
      <button class="velo" onclick={() => (listaAbierta = false)} aria-label="Cerrar la lista" tabindex="-1"></button>
    {/if}
    <Chat onAbrirLista={() => (listaAbierta = true)} />
  </div>
{:else}
  <Entrada />
{/if}

<style>
  .aplicacion {
    display: grid;
    grid-template-columns: 17rem 1fr;
    height: 100dvh;
    overflow: hidden;
  }
  .velo {
    display: none;
  }
  @media (max-width: 760px) {
    .aplicacion {
      grid-template-columns: 1fr;
    }
    .velo {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 15;
      border: none;
      background: var(--velo);
      cursor: default;
    }
  }
</style>

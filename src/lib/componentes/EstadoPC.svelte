<script lang="ts">
  import { estado } from '../estado.svelte'

  let { compacto = false }: { compacto?: boolean } = $props()

  const texto = $derived.by(() => {
    if (estado.generando) {
      return estado.fase === 'pensando' ? 'Tu PC está razonando' : 'Tu PC está escribiendo'
    }
    switch (estado.pc) {
      case 'comprobando': return 'Buscando tu PC…'
      case 'en-linea': return 'Tu PC está en línea'
      case 'sin-ia': return 'Tu PC está encendido, pero la IA no responde'
      case 'sin-conexion': return 'No encuentro tu PC'
    }
  })

  const ayuda = $derived(
    estado.pc === 'sin-conexion'
      ? 'Revisa que esté encendido y conectado a internet.'
      : estado.pc === 'sin-ia'
        ? 'En el PC, escribe: sudo ia-servidor reiniciar'
        : null,
  )

  const tono = $derived(
    estado.generando || estado.pc === 'comprobando' ? 'ocupado'
      : estado.pc === 'en-linea' ? 'bien' : 'mal',
  )
</script>

<div class="estado-pc" class:compacto role="status" aria-live="polite">
  <span class="punto {tono}" aria-hidden="true"></span>
  <span class="texto">
    {texto}
    {#if estado.pc === 'en-linea' && !estado.generando && estado.modelo && compacto}
      <span class="modelo">con {estado.modelo}</span>
    {/if}
  </span>
  {#if ayuda && !compacto}
    <span class="ayuda">{ayuda}</span>
  {/if}
</div>

<style>
  .estado-pc {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 0.6rem;
    align-items: center;
    font-size: 0.9375rem;
  }
  .punto {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--tinta-suave);
  }
  .punto.bien { background: var(--verde); }
  .punto.ocupado { background: var(--ambar-fuerte); }
  .punto.mal { background: var(--rojo); }
  .texto {
    font-weight: 600;
  }
  .modelo {
    font-weight: 400;
    color: var(--tinta-suave);
  }
  .ayuda {
    grid-column: 2;
    color: var(--tinta-suave);
  }
  .compacto {
    font-size: 0.875rem;
  }
</style>

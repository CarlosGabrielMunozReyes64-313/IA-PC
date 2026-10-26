<script lang="ts">
  type Nombre = 'mas' | 'menu' | 'cerrar' | 'papelera' | 'enviar' | 'detener' | 'salir'
  let { nombre, tamano = 20 }: { nombre: Nombre; tamano?: number } = $props()

  const trazos: Record<Nombre, string> = {
    mas: 'M12 5v14M5 12h14',
    menu: 'M4 7h16M4 12h16M4 17h16',
    cerrar: 'M6 6l12 12M18 6L6 18',
    papelera: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
    enviar: 'M12 19V5M5 12l7-7 7 7',
    detener: '',
    salir: 'M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H10',
  }
</script>

<svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  {#if nombre === 'detener'}
    <rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" />
  {:else}
    <path d={trazos[nombre]} fill="none" stroke="currentColor" stroke-width="2"
          stroke-linecap="round" stroke-linejoin="round" />
  {/if}
</svg>

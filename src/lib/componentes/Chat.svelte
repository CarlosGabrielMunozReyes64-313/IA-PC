<script lang="ts">
  import { tick } from 'svelte'
  import { estado } from '../estado.svelte'
  import Compositor from './Compositor.svelte'
  import EstadoPC from './EstadoPC.svelte'
  import Icono from './Icono.svelte'
  import MensajeVista from './MensajeVista.svelte'

  let { onAbrirLista }: { onAbrirLista: () => void } = $props()

  let desplazable: HTMLElement | undefined = $state()
  let pegadoAbajo = true

  function alDesplazar() {
    if (!desplazable) return
    const distancia = desplazable.scrollHeight - desplazable.scrollTop - desplazable.clientHeight
    pegadoAbajo = distancia < 80
  }

  // Mientras llega la respuesta, la pantalla la sigue (salvo que hayas subido a leer)
  $effect(() => {
    const ultimo = estado.mensajes.at(-1)
    void estado.mensajes.length
    void ultimo?.contenido
    void ultimo?.enCurso
    void ultimo?.aviso
    tick().then(() => {
      if (desplazable && pegadoAbajo) desplazable.scrollTop = desplazable.scrollHeight
    })
  })

  // Al abrir otra conversación, empezar desde el final
  $effect(() => {
    void estado.actualId
    pegadoAbajo = true
  })

  const titulo = $derived(estado.actual?.titulo ?? 'Nueva conversación')
</script>

<main class="chat">
  <header class="barra-superior">
    <button class="icono solo-movil" onclick={onAbrirLista} aria-label="Ver conversaciones">
      <Icono nombre="menu" />
    </button>
    <h1 class="titulo">{titulo}</h1>
    <div class="estado solo-escritorio"><EstadoPC compacto /></div>
    <button class="icono solo-movil" onclick={() => estado.nueva()} aria-label="Nueva conversación">
      <Icono nombre="mas" />
    </button>
  </header>

  <div class="desplazable" bind:this={desplazable} onscroll={alDesplazar}>
    <div class="columna">
      {#if estado.mensajes.length === 0 && !estado.cargandoConversacion}
        <section class="bienvenida">
          <h2>Pregúntale lo que quieras</h2>
          <p>
            Las respuestas se generan en el procesador de tu PC y cada conversación se guarda
            en su disco, así que puedes retomarla desde cualquier dispositivo.
          </p>
          <div class="estado-movil solo-movil"><EstadoPC /></div>
        </section>
      {/if}

      {#if estado.cargandoConversacion}
        <p class="cargando">Abriendo la conversación…</p>
      {/if}

      <div class="mensajes">
        {#each estado.mensajes as m (m.clave)}
          <MensajeVista mensaje={m} />
        {/each}
      </div>

      {#if estado.aviso}
        <p class="aviso-general" role="alert">{estado.aviso}</p>
      {/if}
    </div>
  </div>

  <footer class="pie">
    <div class="columna">
      <Compositor />
    </div>
  </footer>
</main>

<style>
  .chat {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 0;
    min-width: 0;
    height: 100dvh;
  }
  .barra-superior {
    display: flex;
    align-items: center;
    gap: var(--espacio-3);
    padding: var(--espacio-3) var(--espacio-5);
    padding-top: calc(var(--espacio-3) + env(safe-area-inset-top, 0px));
    border-bottom: 1px solid var(--borde-suave);
    min-height: 3.75rem;
  }
  .titulo {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 650;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .estado {
    flex: none;
  }
  .icono {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: var(--radio-control);
    background: none;
    color: var(--tinta);
    cursor: pointer;
  }
  .icono:hover {
    background: var(--resalte);
  }
  .icono:focus-visible {
    outline: 3px solid var(--foco);
  }

  .desplazable {
    overflow-y: auto;
    min-height: 0;
    overscroll-behavior: contain;
  }
  .columna {
    width: 100%;
    max-width: 46rem;
    margin-inline: auto;
    padding-inline: var(--espacio-5);
  }
  .desplazable .columna {
    padding-block: var(--espacio-6);
  }
  .mensajes {
    display: flex;
    flex-direction: column;
    gap: var(--espacio-6);
  }

  .bienvenida {
    padding-top: 12vh;
    max-width: 34rem;
  }
  .bienvenida h2 {
    font-family: var(--letra-lectura);
    font-weight: 500;
    font-size: clamp(1.75rem, 4.5vw, 2.4rem);
    line-height: 1.15;
    letter-spacing: -0.01em;
    margin: 0 0 var(--espacio-4);
  }
  .bienvenida p {
    color: var(--tinta-suave);
    font-size: 1.0625rem;
    line-height: 1.6;
    margin: 0;
  }
  .estado-movil {
    margin-top: var(--espacio-5);
  }
  .cargando {
    color: var(--tinta-suave);
  }
  .aviso-general {
    margin: var(--espacio-5) 0 0;
    padding: 0.75rem 1rem;
    border-left: 3px solid var(--rojo);
    background: var(--rojo-fondo);
    color: var(--tinta);
    border-radius: 0 6px 6px 0;
  }

  .pie {
    padding: var(--espacio-2) 0 var(--espacio-4);
    padding-bottom: calc(var(--espacio-4) + env(safe-area-inset-bottom, 0px));
    background: var(--papel);
  }

  .solo-movil {
    display: none;
  }
  @media (max-width: 760px) {
    .solo-movil {
      display: grid;
    }
    .solo-escritorio {
      display: none;
    }
    .barra-superior {
      padding-inline: var(--espacio-2);
      gap: var(--espacio-1);
    }
    .titulo {
      text-align: center;
    }
    .columna {
      padding-inline: var(--espacio-4);
    }
    .bienvenida {
      padding-top: 6vh;
    }
  }
</style>

<script lang="ts">
  import { estado } from '../estado.svelte'
  import EstadoPC from './EstadoPC.svelte'

  let clave = $state('')
  let entrando = $state(false)

  async function enviar(evento: SubmitEvent) {
    evento.preventDefault()
    if (!clave || entrando) return
    entrando = true
    const ok = await estado.entrar(clave)
    entrando = false
    if (ok) clave = ''
  }
</script>

<main class="entrada">
  <div class="columna">
    <h1 class="marca">Aya<span class="cursor" aria-hidden="true"></span></h1>
    <p class="lema">La IA que funciona en el computador de tu casa.</p>

    <EstadoPC />

    <form onsubmit={enviar}>
      <label for="clave">Contraseña</label>
      <input
        id="clave"
        type="password"
        autocomplete="current-password"
        bind:value={clave}
        disabled={entrando}
        aria-describedby={estado.avisoEntrada ? 'aviso-entrada' : undefined}
      />
      {#if estado.avisoEntrada}
        <p id="aviso-entrada" class="aviso" role="alert">{estado.avisoEntrada}</p>
      {/if}
      <button type="submit" disabled={!clave || entrando}>
        {entrando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  </div>
</main>

<style>
  .entrada {
    min-height: 100dvh;
    display: grid;
    align-items: center;
    padding: var(--espacio-6) var(--espacio-5);
  }
  .columna {
    width: 100%;
    max-width: 24rem;
    margin-inline: auto;
  }
  .marca {
    font-size: 2.75rem;
    font-weight: 750;
    letter-spacing: -0.02em;
    line-height: 1;
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 0.12em;
  }
  .cursor {
    display: inline-block;
    width: 0.42em;
    height: 0.78em;
    background: var(--verde);
    border-radius: 2px;
    animation: parpadeo 1.1s steps(1) infinite;
  }
  .lema {
    color: var(--tinta-suave);
    margin: var(--espacio-3) 0 var(--espacio-6);
    font-size: 1.0625rem;
  }
  form {
    display: grid;
    gap: var(--espacio-2);
    margin-top: var(--espacio-6);
  }
  label {
    font-weight: 600;
  }
  input {
    font: inherit;
    font-size: 1.0625rem;
    padding: 0.7rem 0.85rem;
    border: 1.5px solid var(--borde);
    border-radius: var(--radio-control);
    background: var(--superficie);
    color: var(--tinta);
  }
  input:focus-visible {
    outline: 3px solid var(--foco);
    outline-offset: 1px;
    border-color: var(--tinta);
  }
  .aviso {
    margin: 0;
    color: var(--rojo);
    font-size: 0.9375rem;
  }
  button {
    margin-top: var(--espacio-3);
    justify-self: start;
    font: inherit;
    font-weight: 650;
    padding: 0.7rem 1.6rem;
    border: none;
    border-radius: var(--radio-control);
    background: var(--tinta);
    color: var(--papel);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible {
    outline: 3px solid var(--foco);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    .cursor {
      animation: none;
    }
  }
</style>

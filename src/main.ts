import { mount } from 'svelte'
// Fuentes incluidas en la página (no dependen de servicios externos)
import '@fontsource-variable/atkinson-hyperlegible-next'
import '@fontsource-variable/literata/wght.css'
import '@fontsource-variable/literata/wght-italic.css'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

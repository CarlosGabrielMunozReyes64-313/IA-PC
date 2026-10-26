# IA-PC

Chat para hablar con la IA que funciona en el computador de tu casa. La página se publica
en Vercel, pero las preguntas y respuestas viajan directo entre tu dispositivo y tu PC:
la IA corre en su procesador y las conversaciones se guardan en su disco.

Hecho con Svelte 5, TypeScript y Vite.

## Qué hace

- Entrar con la contraseña del servidor (la sesión dura 30 días en cada dispositivo).
- Ver si tu PC está encendido y disponible.
- Respuestas en vivo, palabra por palabra, con formato (listas, tablas, código).
- Modo "Razonar antes de responder" y elección de modelo.
- Detener una respuesta a la mitad (lo escrito hasta ese momento se guarda).
- Historial de conversaciones guardado en tu PC, disponible desde cualquier dispositivo.
- Modo claro y oscuro automático, pensado también para celular.
- Se puede instalar en el celular como una app.

## Probar en tu computador

Necesitas Node.js 22 o superior.

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Se usa el puerto 3000 porque el servidor de IA ya acepta
conexiones desde esa dirección.

Por defecto la página se conecta a `https://servidor-ia.tail9885b3.ts.net`. Para usar otra
dirección, copia `.env.example` como `.env.local` y cámbiala ahí.

## Publicar en Vercel

1. Sube los cambios a GitHub:
   ```bash
   git add -A
   git commit -m "Chat básico"
   git push
   ```
2. En [vercel.com](https://vercel.com), elige **Add New → Project**, importa el repositorio
   y presiona **Deploy**. Vercel detecta Vite solo; no hay que configurar nada.
3. Si algún día cambia la dirección del servidor, agrégala en
   **Settings → Environment Variables** como `VITE_SERVIDOR_URL` y vuelve a publicar.

Cada `git push` publica una versión nueva automáticamente.

## Después de publicar: cerrar el servidor a otras páginas

Hoy el servidor acepta conexiones de cualquier página `*.vercel.app` (igual pide
contraseña). Cuando tengas la dirección exacta de tu página, en el PC servidor:

```bash
sudo nano /etc/ia-servidor/config.env
```

Cambia la línea `IA_ORIGENES` por tu dirección, dejando también la de pruebas locales:

```
IA_ORIGENES="https://tu-pagina.vercel.app,http://localhost:3000"
```

Guarda con Ctrl+O, Enter, Ctrl+X, y reinicia el backend:

```bash
sudo systemctl restart ia-servidor
```

## Instalar en el celular

- **Android (Chrome):** abre la página, toca el menú ⋮ y elige **Instalar app** o
  **Agregar a la pantalla principal**.
- **iPhone (Safari):** toca el botón de compartir y elige **Agregar a inicio**.

## Comandos

| Comando | Para qué |
|---|---|
| `npm run dev` | Probar la página en tu computador |
| `npm run check` | Revisar errores de TypeScript y Svelte |
| `npm run build` | Compilar la versión final (lo hace Vercel al publicar) |
| `npm run preview` | Ver la versión compilada en tu computador |

## Archivos principales

```
src/
  App.svelte                    decide si mostrar la entrada o el chat
  app.css                       colores, letras y espacios
  lib/
    api.ts                      comunicación con el PC servidor
    estado.svelte.ts            estado del chat y sus acciones
    markdown.ts                 formato seguro de las respuestas
    tipos.ts                    forma de los datos del servidor
    componentes/
      Entrada.svelte            pantalla de contraseña
      BarraLateral.svelte       lista de conversaciones
      Chat.svelte               mensajes y encabezado
      MensajeVista.svelte       un mensaje tuyo o de la IA
      Compositor.svelte         caja para escribir
      EstadoPC.svelte           indicador del estado del PC
      Icono.svelte              íconos
public/                         ícono y datos para instalarla como app
```

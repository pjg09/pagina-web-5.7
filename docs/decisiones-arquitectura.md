# Decisiones de arquitectura

Registro de las decisiones técnicas no obvias del proyecto. No documenta cómo funciona el código — eso vive en CLAUDE.md — sino *por qué* se tomaron las decisiones estructurales que dan forma al sistema.

---

## ADR-1 — Sitio estático sin backend propio

**Contexto**

El sitio necesita presentar servicios, capturar intención de compra y conectar con procesadores de pago y agendamiento. No hay usuarios registrados, ni contenido dinámico personalizado, ni operaciones que requieran lógica de servidor propia.

**Decisión**

Astro con output estático. Sin servidor Node, sin API routes, sin base de datos propia.

**Razonamiento**

- El contenido es editorial: cambia con baja frecuencia y no varía por usuario.
- Cero superficie de ataque en servidor propio: sin autenticación que implementar, sin sesiones que gestionar, sin endpoints que asegurar.
- Deploy en Vercel sin configuración: un push a `main` publica. Sin infraestructura que mantener.
- Costo operativo cero en el horizonte actual del negocio.

**Consecuencias**

Toda la lógica transaccional (pagos, webhooks, correlación de datos) vive en servicios externos. El sitio no puede validar tokens en el servidor — esa validación ocurre en Apps Script. Si en el futuro se necesita lógica de servidor propia (autenticación, contenido personalizado, validación server-side de tokens), Astro soporta SSR con adaptador de Vercel sin reescribir los componentes.

---

## ADR-2 — Google Apps Script como capa de integración en lugar de backend propio

**Contexto**

El flujo de pago requiere: recibir webhooks de Wompi, generar tokens UUID, escribir en Google Sheets, enviar correos transaccionales, recibir webhooks de Calendly y correlacionar los tres registros. Eso es lógica de orquestación que no puede vivir en el frontend estático.

**Decisión**

Google Apps Script maneja toda la orquestación de integraciones, publicado como Web App (`doPost`) que recibe los tres webhooks. No se construye un backend Node/Express/serverless propio para esto.

**Razonamiento**

- Apps Script corre dentro de la misma cuenta de Google que ya se necesita para Google Sheets — no hay que crear ni pagar por una cuenta de automatización adicional.
- El acceso a Google Sheets y Gmail es nativo dentro de Apps Script (`SpreadsheetApp`, `MailApp`/`GmailApp`), sin necesidad de OAuth ni credenciales adicionales, porque el script corre como la misma cuenta dueña de la hoja.
- El equipo no tiene capacidad de mantener infraestructura de backend tradicional en este momento del negocio. Apps Script tampoco la requiere: es serverless, hosteado por Google, sin servidores que actualizar.
- Wompi y Calendly no tienen un conector visual dentro de Apps Script (a diferencia de plataformas no-code tipo Make) — su webhook se recibe como JSON crudo en `doPost(e)` y se parsea a mano. Es más trabajo de código, pero evita depender de un tercero adicional y de sus límites de plan.

**Consecuencias**

- El código de Apps Script vive fuera de este repositorio (en el editor de Apps Script, dentro de Google Drive). Si se pierde el acceso a la cuenta, hay que reconstruirlo. **Mitigación:** versionar el código con `clasp` y mantener una copia espejo en `docs/` o en un directorio del repo cuando se implemente.
- No hay interfaz visual de ejecución como en herramientas no-code: el debugging se hace leyendo los logs de ejecución de Apps Script (Stackdriver/Cloud Logging), no viendo un diagrama de flujo.
- Vendor lock-in en Google Apps Script para la lógica de negocio central. Si Google cambia las cuotas gratuitas o deprecia alguna API (`UrlFetchApp`, `MailApp`), hay que ajustar el código.
- Las cuotas diarias de la cuenta de Google (envíos de Gmail: 100/día en cuenta gratuita; tiempo máximo de ejecución por script: 6 minutos; llamadas de `UrlFetchApp`) pueden convertirse en un cuello de botella con volumen alto. En ese punto, migrar a un backend propio (función serverless en Vercel) es la salida natural — y Astro SSR facilita esa transición sin tocar el frontend.

---

## ADR-3 — Token UUID en URLs del flujo de pago, no payment_id crudo

**Contexto**

Después de un pago aprobado, el artista recibe un enlace para acceder a `/formulario`. Ese enlace necesita identificar unívocamente al comprador para correlacionar el formulario con el pago.

La opción más directa sería usar el `payment_id` que devuelve Wompi: `/formulario?payment_id=WOMPI-12345678`.

**Decisión**

Apps Script genera un UUID aleatorio (`Utilities.getUuid()`) por cada pago y ese UUID es el que viaja en la URL. El `payment_id` nunca aparece en ninguna URL pública.

**Razonamiento**

- El `payment_id`/referencia de transacción de Wompi puede ser predecible o secuencial según el flujo de checkout usado. Con el ID de un pago propio se podría intentar construir `/formulario?payment_id=WOMPI-12345677` y acceder al formulario de otro artista.
- El UUID generado por `Utilities.getUuid()` tiene 2¹²² combinaciones posibles — no es enumerable ni predecible.
- El token tiene estado en Google Sheets (`pendiente_formulario` → `pendiente_agendamiento`). Apps Script lo invalida después del primer uso exitoso, eliminando la posibilidad de replay.
- Si el `payment_id` estuviera en la URL, quedaría expuesto en logs del servidor, analytics (GA4) y el historial del navegador.

**Consecuencias**

- Apps Script debe generar y almacenar el token antes de enviar el correo. Agrega un paso a la función que procesa el webhook de pago.
- El formulario en `/formulario.astro` solo puede verificar que el parámetro `token` existe en la URL — la validación de que el token es legítimo y no fue usado ocurre en Apps Script al procesar el POST. El frontend no puede proteger contra tokens inválidos antes de mostrar el formulario, pero sí puede mostrar un error después del envío fallido.

---

## ADR-4 — Wompi como pasarela de pagos

**Contexto**

El negocio opera en Colombia. Los clientes actuales son artistas y empresas colombianas que pagan en COP.

**Decisión**

Wompi (pasarela colombiana, respaldada por Bancolombia) como único procesador de pago.

**Razonamiento**

- Wompi tiene fuerte penetración en Colombia: soporta PSE (transferencia bancaria directa), tarjetas de crédito/débito nacionales e internacionales, y Nequi — varias opciones que reducen la fricción del pagador colombiano sin necesitar una segunda pasarela.
- Una sola integración mantiene simple la función `doPost` de Apps Script que recibe el webhook de pago: un solo formato de evento que parsear, no dos.
- El equipo no tiene, por ahora, un volumen de clientes internacionales que justifique evaluar una pasarela adicional.

**Consecuencias**

- Si en el futuro aparece demanda concreta de clientes que pagan con tarjetas emitidas fuera de Latinoamérica y Wompi no las procesa bien, se evaluará una pasarela adicional — eso implica un segundo bloque de parseo dentro de la misma función de Apps Script, sin cambiar el resto del flujo (token, Sheets, correos).

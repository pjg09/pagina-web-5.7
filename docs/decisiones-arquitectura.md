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

Toda la lógica transaccional (pagos, webhooks, correlación de datos) vive en servicios externos. El sitio no puede validar tokens en el servidor — esa validación ocurre en Make. Si en el futuro se necesita lógica de servidor propia (autenticación, contenido personalizado, validación server-side de tokens), Astro soporta SSR con adaptador de Vercel sin reescribir los componentes.

---

## ADR-2 — Make como capa de integración en lugar de backend propio

**Contexto**

El flujo de pago requiere: recibir webhooks de MercadoPago, generar tokens UUID, escribir en Google Sheets, enviar correos transaccionales, recibir webhooks de Calendly y correlacionar los tres registros. Eso es lógica de orquestación que no puede vivir en el frontend estático.

**Decisión**

Make maneja toda la orquestación de integraciones. No se construye un backend Node/Express/serverless propio para esto.

**Razonamiento**

- Los tres sistemas externos (MercadoPago, Calendly, Gmail) tienen módulos nativos en Make. Conectarlos desde código propio requeriría manejar autenticación OAuth, reintentos, y lógica de error de tres APIs distintas.
- El equipo no tiene capacidad de mantener infraestructura de backend en este momento del negocio.
- Make provee trazabilidad visual de cada ejecución, lo que facilita debuggear el flujo sin acceso a logs de servidor.
- Google Sheets como almacenamiento temporal es suficiente para el volumen esperado y permite al equipo operar sin acceso a una base de datos.

**Consecuencias**

- Los escenarios de Make son configuración opaca fuera del repositorio. Si se pierden, hay que reconstruirlos. **Mitigación:** documentar los escenarios cuando se implementen (pendiente en `docs/`).
- Vendor lock-in en Make para la lógica de negocio central. Si Make sube precios o cambia la API, la migración requiere reescribir la orquestación.
- El límite de operaciones del plan de Make puede convertirse en un cuello de botella con volumen alto. En ese punto, migrar a un backend propio es la salida natural — y Astro SSR facilita esa transición sin tocar el frontend.

---

## ADR-3 — Token UUID en URLs del flujo de pago, no payment_id crudo

**Contexto**

Después de un pago aprobado, el artista recibe un enlace para acceder a `/formulario`. Ese enlace necesita identificar unívocamente al comprador para correlacionar el formulario con el pago.

La opción más directa sería usar el `payment_id` que devuelve MercadoPago: `/formulario?payment_id=MP-12345678`.

**Decisión**

Make genera un UUID aleatorio por cada pago y ese UUID es el que viaja en la URL. El `payment_id` nunca aparece en ninguna URL pública.

**Razonamiento**

- El `payment_id` de MercadoPago es predecible: es un entero secuencial. Con el ID de un pago propio se puede construir `/formulario?payment_id=MP-12345677` e intentar acceder al formulario de otro artista.
- El UUID es generado aleatoriamente por Make y tiene 2¹²² combinaciones posibles — no es enumerable ni predecible.
- El token tiene estado en Google Sheets (`pendiente_formulario` → `pendiente_agendamiento`). Make lo invalida después del primer uso exitoso, eliminando la posibilidad de replay.
- Si el `payment_id` estuviera en la URL, quedaria expuesto en logs del servidor, analytics (GA4) y el historial del navegador.

**Consecuencias**

- Make debe generar y almacenar el token antes de enviar el correo. Agrega un paso al Escenario 1.
- El formulario en `/formulario.astro` solo puede verificar que el parámetro `token` existe en la URL — la validación de que el token es legítimo y no fue usado ocurre en Make al procesar el POST. El frontend no puede proteger contra tokens inválidos antes de mostrar el formulario, pero sí puede mostrar un error después del envío fallido.

---

## ADR-4 — MercadoPago como procesador inicial, Stripe evaluado después

**Contexto**

El negocio opera en Colombia. Los clientes actuales son artistas y empresas colombianas que pagan en COP.

**Decisión**

MercadoPago al lanzamiento. Stripe se evalúa cuando aparezca demanda concreta de clientes internacionales.

**Razonamiento**

- MercadoPago tiene mayor penetración en Colombia y Latinoamérica. Menor fricción para el pagador colombiano.
- PSE (transferencia bancaria directa) y pagos en efectivo vía Efecty son opciones que MercadoPago habilita y Stripe no.
- Integrar dos procesadores desde el inicio duplica la complejidad del Escenario 1 de Make sin un cliente internacional concreto que lo justifique.

**Consecuencias**

- Clientes internacionales no pueden pagar con tarjeta emitida fuera de Latinoamérica fácilmente. Ese es el costo consciente de esta decisión.
- El flujo en Make está diseñado para que agregar Stripe sea un segundo trigger en el Escenario 1, sin cambios al resto del flujo. Ver `docs/flujo-pago-artistas.md` sección "Compatibilidad con procesadores de pago".

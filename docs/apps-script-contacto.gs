// Apps Script — Formulario de contacto (contacto.astro)
// Web App dedicado, independiente del script de Wompi/Calendly/formulario.
// Deployment ID: AKfycby7zbVXA097bnT7gLBtjgoGiGPN7tjaKtaC2QmcthytIbkzF3J5pRI1v0WfR47Gysub
// URL: https://script.google.com/macros/s/AKfycby7zbVXA097bnT7gLBtjgoGiGPN7tjaKtaC2QmcthytIbkzF3J5pRI1v0WfR47Gysub/exec
// Sheet ID: 1AqNF2_ND3moWgar1Pr61J5TMpgCSTUWZQ4ZWCdAvI0g
// Ejecutar como: ocl57group@gmail.com | Acceso: Cualquier usuario

const TEAM_EMAIL = "contacto@ocl57group.com";
const SENDER_ALIAS = "contacto@ocl57group.com";
const SENDER_NAME = "5.7 Onda Creativa Launch";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  const nombre    = data.nombre    || "";
  const email     = data.email     || "";
  const telefono  = data.telefono  || "";
  const empresa   = data.empresa   || "";
  const linea     = data.linea     || "";
  const instagram = data.instagram || "";
  const necesidad = data.necesidad || "";

  // Evidencia del consentimiento (Ley 1581 de 2012): qué aceptó, cuándo y bajo qué
  // versión de la política. Se guarda en el Sheet junto al resto de la solicitud.
  const consentimiento   = data.consentimiento === "true" ? "SÍ" : "NO";
  const versionPolitica  = data.version_politica || "";
  const userAgent        = data.user_agent || "";
  const timestamp = new Date();

  // El formulario exige la casilla marcada; si aun así llega sin consentimiento,
  // se registra pero no se envía ninguna comunicación comercial.
  if (consentimiento !== "SÍ") {
    appendToSheet(timestamp, nombre, email, telefono, empresa, linea, instagram, necesidad,
                  consentimiento, versionPolitica, userAgent);
    return ContentService
      .createTextOutput(JSON.stringify({ status: "sin_consentimiento" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  appendToSheet(timestamp, nombre, email, telefono, empresa, linea, instagram, necesidad,
                consentimiento, versionPolitica, userAgent);
  sendConfirmationEmail(nombre, email, empresa, linea, necesidad);
  sendTeamNotification(nombre, email, telefono, empresa, linea, instagram, necesidad, timestamp);

  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Columnas del Sheet (en este orden):
// Fecha | Nombre | Email | Teléfono | Empresa | Línea | Instagram | Necesidad |
// Consentimiento | Versión política | User agent
function appendToSheet(timestamp, nombre, email, telefono, empresa, linea, instagram, necesidad,
                       consentimiento, versionPolitica, userAgent) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([timestamp, nombre, email, telefono, empresa, linea, instagram, necesidad,
                   consentimiento, versionPolitica, userAgent]);
}

// Escapa los valores del formulario antes de interpolarlos en el htmlBody.
function escapeHtml(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Primer nombre para el saludo ("Pedro Gómez" -> "Pedro"). Si viene vacío, saluda sin nombre.
function primerNombre(nombre) {
  const partes = String(nombre).trim().split(/\s+/);
  return partes[0] || "";
}

// El formulario envía el value crudo del radio ("marca" / "artista"); el correo muestra la etiqueta.
function etiquetaLinea(linea) {
  const mapa = { marca: "Marca", artista: "Artista" };
  return mapa[String(linea).toLowerCase()] || linea;
}

// Debe coincidir con RUTA_POLITICA_DATOS de src/data/constantes.ts
const URL_POLITICA_DATOS = "https://ocl57group.com/politica-de-tratamiento-de-datos";

const AVISO_DATOS =
  "La información suministrada mediante este formulario será tratada por OCL5.7 conforme a la " +
  "normativa aplicable sobre protección de datos personales, y será utilizada para atender solicitudes, " +
  "establecer contacto comercial, enviar propuestas y compartir información relacionada con nuestros " +
  "servicios, promociones y novedades. Como titular de los datos, podrás conocer, actualizar, rectificar " +
  "o solicitar la eliminación de tu información mediante solicitud enviada a nuestro canal oficial de contacto.";

function sendConfirmationEmail(nombre, email, empresa, linea, necesidad) {
  const subject = "Hemos recibido tu solicitud — OCL 5.7";
  const saludo = primerNombre(nombre);
  const lineaLabel = etiquetaLinea(linea);

  // --- Versión texto plano (fallback para clientes sin HTML) ---
  const body =
    "Hola " + saludo + ",\n\n" +
    "Gracias por contactarte con Onda creativa launch 5.7.\n\n" +
    "Hemos recibido correctamente tu solicitud y nuestro equipo ya se encuentra revisando la información que nos compartiste.\n\n" +
    "Resumen de tu solicitud:\n" +
    "• Empresa / Nombre artístico: " + empresa + "\n" +
    "• Línea de servicio: " + lineaLabel + "\n" +
    "• Necesidad: " + necesidad + "\n\n" +
    "Cada proyecto que desarrollamos es analizado de forma estratégica, ya que nuestras soluciones son personalizadas y se construyen según los objetivos, necesidades y alcance de cada cliente.\n\n" +
    "Tan pronto nos sea posible, uno de nuestros especialistas se pondrá en contacto contigo a través de este mismo correo o mediante los datos suministrados para profundizar en tu solicitud.\n\n" +
    "Dependiendo del alcance del proyecto, la elaboración de una propuesta comercial personalizada puede tomar entre 2 y 4 días hábiles.\n\n" +
    "Si tu solicitud requiere atención prioritaria, por favor responde a este correo indicando en el asunto la palabra: PRIORIDAD.\n\n" +
    "Saludos cordiales,\n\n" +
    "Equipo Onda Creativa Launch 5.7\n\n\n" +
    "Aviso de tratamiento de datos personales:\n" +
    AVISO_DATOS + "\n" +
    "Consulta la política completa en: " + URL_POLITICA_DATOS;

  // --- Versión HTML (estilos inline: los clientes de correo ignoran <style>) ---
  const p = "margin: 0 0 16px; text-align: justify;";
  const htmlBody =
    '<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.5; color: #000000; max-width: 640px;">' +
      '<p style="' + p + '">Hola ' + escapeHtml(saludo) + ',</p>' +
      '<p style="' + p + '">Gracias por contactarte con <strong>Onda creativa launch 5.7.</strong></p>' +
      '<p style="' + p + '">Hemos recibido correctamente tu solicitud y nuestro equipo ya se encuentra revisando la información que nos compartiste.</p>' +
      '<p style="margin: 0 0 4px;">Resumen de tu solicitud:</p>' +
      '<p style="margin: 0 0 16px;">' +
        '• Empresa / Nombre artístico: ' + escapeHtml(empresa) + '<br />' +
        '• Línea de servicio: ' + escapeHtml(lineaLabel) + '<br />' +
        '• Necesidad: ' + escapeHtml(necesidad).replace(/\r?\n/g, '<br />') +
      '</p>' +
      '<p style="' + p + '">Cada proyecto que desarrollamos es analizado de forma estratégica, ya que nuestras soluciones son personalizadas y se construyen según los objetivos, necesidades y alcance de cada cliente.</p>' +
      '<p style="' + p + '">Tan pronto nos sea posible, uno de nuestros especialistas se pondrá en contacto contigo a través de este mismo correo o mediante los datos suministrados para profundizar en tu solicitud.</p>' +
      '<p style="' + p + '">Dependiendo del alcance del proyecto, la elaboración de una propuesta comercial personalizada puede tomar entre 2 y 4 días hábiles.</p>' +
      '<p style="' + p + '">Si tu solicitud requiere atención prioritaria, por favor responde a este correo indicando en el asunto la palabra: PRIORIDAD.</p>' +
      '<p style="margin: 0 0 16px;">Saludos cordiales,</p>' +
      '<p style="margin: 0 0 28px;"><strong>Equipo Onda Creativa Launch 5.7</strong></p>' +
      '<p style="margin: 0 0 4px; font-size: 11px;"><strong>Aviso de tratamiento de datos personales:</strong></p>' +
      '<p style="margin: 0 0 6px; font-size: 11px; line-height: 1.45; text-align: justify;">' + AVISO_DATOS + '</p>' +
      '<p style="margin: 0; font-size: 11px;"><a href="' + URL_POLITICA_DATOS + '" style="color: #0b63c5;">Consulta la política completa</a></p>' +
    '</div>';

  GmailApp.sendEmail(email, subject, body, {
    name: SENDER_NAME,
    replyTo: SENDER_ALIAS,
    htmlBody: htmlBody,
  });
}

function sendTeamNotification(nombre, email, telefono, empresa, linea, instagram, necesidad, timestamp) {
  const subject = "Nueva solicitud de contacto — " + empresa;
  const body =
    "Nueva solicitud recibida desde el formulario de contacto del sitio.\n\n" +
    "Nombre: " + nombre + "\n" +
    "Email: " + email + "\n" +
    "Teléfono: " + telefono + "\n" +
    "Empresa / Nombre artístico: " + empresa + "\n" +
    "Línea: " + linea + "\n" +
    "Instagram: " + instagram + "\n" +
    "Necesidad:\n" + necesidad + "\n\n" +
    "Fecha: " + timestamp;

  GmailApp.sendEmail(TEAM_EMAIL, subject, body, {
    name: SENDER_NAME,
    replyTo: SENDER_ALIAS,
  });
}

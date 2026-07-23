// CONTACTO 
// Fuente única de los números: se edita aquí el formato visible y las URLs se derivan.
export const WHATSAPP_1_DISPLAY = "+57 311 811 6221";
export const WHATSAPP_2_DISPLAY = "+57 311 809 9889";

const soloDigitos = (tel: string) => tel.replace(/\D/g, "");

export const WHATSAPP_1 = `https://wa.me/${soloDigitos(WHATSAPP_1_DISPLAY)}`;
export const WHATSAPP_2 = `https://wa.me/${soloDigitos(WHATSAPP_2_DISPLAY)}`;
export const EMAIL = "contacto@ocl57group.com";
export const INSTAGRAM = "https://instagram.com/ondacreativalaunch5.7";
export const FACEBOOK = "https://facebook.com/ondacreativalaunch5.7";
export const TIKTOK = "https://tiktok.com/@ondacreativalaunch5.7";

// Mensaje por defecto para CTA WhatsApp general
export const WHATSAPP_DEFAULT_MSG = encodeURIComponent(
    "Hola, quiero conocer más sobre los servicios de 5.7 / Onda Creativa Launch."
);
export const WHATSAPP_CTA = `${WHATSAPP_1}?text=${WHATSAPP_DEFAULT_MSG}`;

// DATOS LEGALES DE LA EMPRESA
export const RAZON_SOCIAL = "ONDA CREATIVA LAUNCH 5.7 S.A.S.";
export const NIT = "901890578";
export const DIRECCION = "CL 80C # 72C - 33";
export const CIUDAD = "Medellín, Colombia";
export const DOMICILIO = `${DIRECCION}, ${CIUDAD}`;
export const SITIO_WEB = "ocl57group.com";

// Rutas de los documentos legales (enlazadas desde el footer y el formulario de contacto)
export const RUTA_POLITICA_DATOS = "/politica-de-tratamiento-de-datos";
export const RUTA_TERMINOS = "/terminos-y-condiciones";
export const RUTA_COOKIES = "/politica-de-cookies";

// Fecha de última actualización de los documentos legales.
// VERSION_POLITICA_DATOS se guarda como evidencia junto a cada consentimiento:
// permite saber QUÉ versión del documento aceptó cada persona. Al publicar
// cambios de fondo en la política, actualizar esta fecha.
export const FECHA_ACTUALIZACION_LEGAL = "23 de julio de 2026";
export const VERSION_POLITICA_DATOS = "2026-07-23";

// Texto de autorización que acompaña al checkbox de consentimiento.
export const TEXTO_AUTORIZACION_DATOS =
    `Autorizo de manera previa, expresa e informada a ${RAZON_SOCIAL} para recolectar, ` +
    "almacenar y tratar mis datos personales con fines de contacto comercial, envío de " +
    "propuestas, seguimiento de servicios y comunicaciones relacionadas, conforme a su";

// CALENDLY
// TODO: reemplazar con links reales de Calendly al configurar
export const CALENDLY_ARTISTAS = "https://calendly.com/TU_USUARIO/asesoria-artistas";
export const CALENDLY_EMPRESAS = "https://calendly.com/TU_USUARIO/diagnostico-empresas";

// WOMPI
// TODO: reemplazar con link real de pago al configurar Wompi
export const WOMPI_ASESORIA_ARTISTAS = "https://checkout.wompi.co/l/TU_LINK_DE_PAGO";

// PRECIOS 
export const PRECIO_COP = "$150.000 COP";
export const PRECIO_USD = "~$50 USD";

// NAVEGACIÓN 
export const NAV_LINKS = [
    { label: "Inicio", href: "/" },
    { label: "Empresas", href: "/empresas" },
    { label: "Artistas", href: "/artistas" },
    { label: "Seguridad VIP", href: "/seguridad-movilidad" },
    { label: "Agendamientos", href: "/agendamientos" },
    { label: "Contacto", href: "/contacto" },
];

// APPS SCRIPT WEBHOOK
// TODO: reemplazar con la URL real del Web App al publicarlo en Apps Script
export const APPSCRIPT_WEBHOOK_FORMULARIO = "https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec?origen=formulario";

// Web App dedicado al formulario de contacto.astro (script independiente del de arriba)
export const URL_APP_WEB_CONTACTO = "https://script.google.com/macros/s/AKfycby7zbVXA097bnT7gLBtjgoGiGPN7tjaKtaC2QmcthytIbkzF3J5pRI1v0WfR47Gysub/exec";
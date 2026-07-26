/** Legal page copy. Bracketed placeholders are intentional — fill in before publish. */

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string };

export type LegalDoc = {
  title: string;
  updatedLabel: string;
  updatedValue: string;
  blocks: LegalBlock[];
};

export const PRIVACY_DOC: LegalDoc = {
  title: "Política de Privacidad",
  updatedLabel: "Última actualización",
  updatedValue: "[FECHA]",
  blocks: [
    {
      type: "note",
      text: "⚠️ Nota importante antes de publicar: este documento es un borrador completo y estructurado conforme a buenas prácticas del RGPD y a los requisitos actuales de Apple y Google para tiendas de apps. No sustituye la revisión de un abogado. Antes de publicarlo, completa los campos entre corchetes [ ] y haz que un profesional legal lo revise, especialmente por el tratamiento de datos de perfil psicológico/preferencias de viaje y por la operación en distintos países.",
    },
    { type: "h2", text: "1. Quiénes somos" },
    {
      type: "p",
      text: 'Responsable del tratamiento: [NOMBRE LEGAL DE LA EMPRESA / AUTÓNOMO — ej. "BeTacora S.L." o tu nombre si operas como autónomo]',
    },
    { type: "p", text: "NIF/CIF: [NÚMERO]" },
    { type: "p", text: "Domicilio: [DIRECCIÓN COMPLETA]" },
    {
      type: "p",
      text: "Email de contacto para temas de privacidad: [EMAIL, ej. privacidad@beta-cora.com]",
    },
    { type: "p", text: "Sitio web: https://www.beta-cora.com" },
    {
      type: "p",
      text: "Si en el futuro nombras un Delegado de Protección de Datos (DPO), añade aquí su contacto.",
    },
    { type: "h2", text: "2. Qué es BeTacora" },
    {
      type: "p",
      text: "BeTacora es una aplicación de planificación de viajes que utiliza inteligencia artificial para generar itinerarios personalizados a partir de un perfil de viajero (arquetipo) construido con las respuestas del usuario a un cuestionario, y que permite buscar y seleccionar vuelos, actividades y otros servicios de viaje a través de proveedores externos.",
    },
    { type: "h2", text: "3. Qué datos recopilamos" },
    { type: "h3", text: "3.1 Datos que nos das directamente" },
    {
      type: "ul",
      items: [
        'Datos de cuenta: nombre, email, contraseña (si te registras con email) o identificador de tu cuenta de Google (si usas "Continuar con Google").',
        "Respuestas del cuestionario de perfil de viajero: ritmo de viaje, energía, motivaciones, estilo de exploración, preferencias de comida, cultura, tipo de alojamiento, actividades e intereses, presupuesto, con quién sueles viajar, y demás respuestas que configuran tu arquetipo de viajero.",
        "Datos de cada viaje: destino, fechas, presupuesto, número de acompañantes, actividades específicas para ese viaje.",
        "Selecciones de servicios: ofertas de vuelos u otros servicios que selecciones dentro de la app.",
        "Comunicaciones: si nos escribes (soporte, feedback), guardamos ese contenido.",
      ],
    },
    { type: "h3", text: "3.2 Datos que recopilamos automáticamente" },
    {
      type: "ul",
      items: [
        "Datos técnicos: dirección IP, tipo de navegador/dispositivo, sistema operativo, identificadores de instalación de la app.",
        "Datos de uso: páginas o pantallas visitadas, itinerarios generados, interacciones dentro de la app, fecha y hora de acceso.",
        "Cookies y tecnologías similares: utilizamos cookies esenciales para el funcionamiento del servicio (por ejemplo, mantener tu sesión iniciada). [Completa esta sección si en el futuro añades cookies de analítica o marketing, y añade un banner de consentimiento de cookies conforme a la normativa de tu país].",
      ],
    },
    { type: "h3", text: "3.3 Datos de terceros (login social)" },
    {
      type: "p",
      text: "Si te registras con Google, recibimos de Google tu nombre, email y foto de perfil (si la tienes configurada), según los permisos que Google te muestre en el momento de autorizar el acceso.",
    },
    { type: "h2", text: "4. Con qué finalidad tratamos tus datos" },
    {
      type: "table",
      headers: ["Finalidad", "Base legal (RGPD)"],
      rows: [
        ["Crear y gestionar tu cuenta", "Ejecución de un contrato (art. 6.1.b)"],
        [
          "Generar tu perfil de viajero y tus itinerarios personalizados",
          "Ejecución de un contrato (art. 6.1.b)",
        ],
        [
          "Buscar y mostrarte ofertas de vuelos/actividades/servicios de viaje reales",
          "Ejecución de un contrato (art. 6.1.b)",
        ],
        [
          "Enviarte emails transaccionales (confirmación de cuenta, recuperación de contraseña)",
          "Ejecución de un contrato (art. 6.1.b)",
        ],
        [
          "Mejorar el servicio y corregir errores",
          "Interés legítimo (art. 6.1.f)",
        ],
        [
          "Enviarte comunicaciones comerciales o newsletter",
          "Consentimiento (art. 6.1.a) — solo si activas esta función y das tu consentimiento expreso",
        ],
        [
          "Cumplir obligaciones legales (por ejemplo, ante requerimientos de autoridades)",
          "Obligación legal (art. 6.1.c)",
        ],
      ],
    },
    { type: "h2", text: "5. Uso de Inteligencia Artificial" },
    {
      type: "p",
      text: "Para generar tu itinerario personalizado, tus respuestas del cuestionario y los parámetros de tu viaje (destino, fechas, presupuesto, actividades) se envían a un proveedor de inteligencia artificial de terceros (Anthropic, proveedor del modelo Claude) mediante su API, con el único fin de generar el contenido de tu itinerario. Este proveedor procesa los datos conforme a sus propias políticas de privacidad y acuerdos de tratamiento de datos como encargado del tratamiento.",
    },
    {
      type: "p",
      text: "No utilizamos tus datos para entrenar modelos de inteligencia artificial propios ni de terceros sin tu consentimiento explícito adicional.",
    },
    { type: "h2", text: "6. Con quién compartimos tus datos" },
    {
      type: "p",
      text: "No vendemos tus datos personales. Los compartimos únicamente con:",
    },
    { type: "h3", text: "6.1 Proveedores de servicios (encargados del tratamiento)" },
    {
      type: "table",
      headers: ["Proveedor", "Finalidad"],
      rows: [
        ["Supabase", "Base de datos, autenticación y almacenamiento"],
        ["Anthropic (Claude API)", "Generación de itinerarios mediante IA"],
        ["Duffel", "Búsqueda y gestión de ofertas de vuelos"],
        ["Viator (cuando esté activo)", "Búsqueda de actividades y experiencias"],
        ["Google (OAuth)", "Inicio de sesión con cuenta de Google"],
        ["Resend", "Envío de emails transaccionales"],
        ["Vercel", "Alojamiento (hosting) de la aplicación"],
        ["Cloudflare", "Gestión de DNS y seguridad de red"],
      ],
    },
    {
      type: "p",
      text: "Cada uno de estos proveedores actúa como encargado del tratamiento bajo nuestras instrucciones, y accede solo a los datos estrictamente necesarios para prestar su servicio.",
    },
    { type: "h3", text: "6.2 Transferencias internacionales" },
    {
      type: "p",
      text: "Algunos de estos proveedores pueden procesar datos fuera del Espacio Económico Europeo (por ejemplo, en Estados Unidos). En esos casos, nos aseguramos de que existan garantías adecuadas conforme al RGPD (como las Cláusulas Contractuales Tipo de la Comisión Europea, o la adhesión del proveedor a marcos de transferencia reconocidos, como el EU-U.S. Data Privacy Framework, según aplique en cada caso).",
    },
    { type: "h3", text: "6.3 Autoridades" },
    {
      type: "p",
      text: "Podemos compartir datos si así lo exige la ley, una orden judicial, o para proteger nuestros derechos, seguridad o los de terceros.",
    },
    { type: "h2", text: "7. Cuánto tiempo conservamos tus datos" },
    {
      type: "ul",
      items: [
        "Datos de cuenta y perfil: mientras mantengas tu cuenta activa.",
        "Itinerarios y viajes guardados: mientras mantengas tu cuenta activa, salvo que los elimines antes.",
        "Tras eliminar tu cuenta: eliminamos tus datos personales en un plazo máximo de [PLAZO, ej. 30 días], salvo la información que debamos conservar por obligación legal (por ejemplo, datos fiscales de transacciones, si aplica) durante el plazo exigido por la normativa correspondiente.",
      ],
    },
    { type: "h2", text: "8. Tus derechos" },
    {
      type: "p",
      text: "Si resides en la Unión Europea (u otra jurisdicción con derechos equivalentes), tienes derecho a:",
    },
    {
      type: "ul",
      items: [
        "Acceder a tus datos personales",
        "Rectificar datos inexactos",
        'Suprimir tus datos ("derecho al olvido")',
        "Limitar el tratamiento en determinados casos",
        "Portabilidad de tus datos a otro proveedor",
        "Oponerte al tratamiento basado en interés legítimo",
        "Retirar tu consentimiento en cualquier momento, cuando el tratamiento se base en él",
      ],
    },
    {
      type: "p",
      text: "Para ejercer cualquiera de estos derechos, escríbenos a [EMAIL DE PRIVACIDAD]. Responderemos en el plazo máximo legal aplicable (generalmente un mes conforme al RGPD).",
    },
    {
      type: "p",
      text: "También tienes derecho a presentar una reclamación ante la autoridad de control competente (en España, la Agencia Española de Protección de Datos, www.aepd.es).",
    },
    { type: "h3", text: "8.1 Eliminación de cuenta (requisito de Apple y Google)" },
    {
      type: "p",
      text: 'Puedes eliminar tu cuenta y todos los datos asociados directamente desde la app, en [Perfil → Configuración → Eliminar cuenta] [AJUSTA ESTA RUTA A LA UBICACIÓN REAL CUANDO EXISTA LA APP NATIVA]. Esta opción está disponible sin necesidad de contactar con soporte. Si te registraste con "Continuar con Google" o "Sign in with Apple", al eliminar tu cuenta también revocamos el acceso concedido a través de esos proveedores.',
    },
    { type: "h2", text: "9. Menores de edad" },
    {
      type: "p",
      text: "BeTacora no está dirigida a menores de 18 años. No recopilamos intencionadamente datos de menores. Si detectamos que un menor nos ha proporcionado datos personales sin el consentimiento de sus padres o tutores, procederemos a eliminarlos.",
    },
    { type: "h2", text: "10. Seguridad" },
    {
      type: "p",
      text: "Aplicamos medidas técnicas y organizativas razonables para proteger tus datos, incluyendo cifrado de contraseñas, control de acceso mediante autenticación, y uso de proveedores con certificaciones de seguridad reconocidas (Supabase, Vercel). Ningún sistema es 100% infalible; si detectamos una brecha de seguridad que afecte a tus datos, te lo notificaremos conforme a lo exigido por la ley.",
    },
    { type: "h2", text: "11. Cambios en esta política" },
    {
      type: "p",
      text: "Podemos actualizar esta Política de Privacidad ocasionalmente. Si los cambios son sustanciales, te lo notificaremos por email o mediante un aviso destacado en la app antes de que entren en vigor.",
    },
    { type: "h2", text: "12. Contacto" },
    {
      type: "p",
      text: "Para cualquier duda sobre esta política o sobre el tratamiento de tus datos: [EMAIL DE CONTACTO]",
    },
  ],
};

export const TERMS_DOC: LegalDoc = {
  title: "Términos y Condiciones de Uso",
  updatedLabel: "Última actualización",
  updatedValue: "[FECHA]",
  blocks: [
    {
      type: "note",
      text: "⚠️ Nota importante antes de publicar: este es un borrador estructurado que cubre los puntos habituales exigidos por Apple, Google, y la normativa de protección al consumidor. No sustituye la revisión de un abogado, especialmente en lo referente a responsabilidad frente a terceros proveedores de viaje (vuelos, actividades) y condiciones de cancelación/reembolso.",
    },
    { type: "h2", text: "1. Aceptación de los términos" },
    {
      type: "p",
      text: 'Al crear una cuenta o utilizar BeTacora (en adelante, "la App" o "el Servicio"), aceptas estos Términos y Condiciones de Uso y nuestra Política de Privacidad (/privacidad). Si no estás de acuerdo, no debes utilizar el Servicio.',
    },
    {
      type: "p",
      text: "Responsable del servicio: [NOMBRE LEGAL DE LA EMPRESA]",
    },
    { type: "p", text: "Contacto: [EMAIL]" },
    { type: "h2", text: "2. Descripción del servicio" },
    {
      type: "p",
      text: "BeTacora es una plataforma que:",
    },
    {
      type: "ul",
      items: [
        "Construye un perfil de viajero personalizado a partir de tus respuestas a un cuestionario.",
        "Genera itinerarios de viaje personalizados mediante inteligencia artificial.",
        "Te permite buscar y seleccionar ofertas de vuelos, actividades y otros servicios de viaje ofrecidos por proveedores externos independientes (por ejemplo, aerolíneas a través de Duffel, actividades a través de Viator).",
      ],
    },
    {
      type: "p",
      text: "Importante: BeTacora actúa como intermediario tecnológico. La contratación final del vuelo, actividad o servicio de viaje se realiza con el proveedor correspondiente, sujeta a sus propios términos, condiciones, políticas de cancelación y reembolso, de las que BeTacora no es responsable.",
    },
    { type: "h2", text: "3. Cuentas de usuario" },
    {
      type: "ul",
      items: [
        "Debes tener al menos 18 años para crear una cuenta.",
        "Eres responsable de mantener la confidencialidad de tus credenciales de acceso.",
        "Eres responsable de toda la actividad que ocurra bajo tu cuenta.",
        "Puedes eliminar tu cuenta en cualquier momento desde los ajustes de la app o el sitio web.",
        "Nos reservamos el derecho de suspender o eliminar cuentas que incumplan estos términos, incluyan información falsa, o realicen un uso fraudulento o abusivo del Servicio.",
      ],
    },
    { type: "h2", text: "4. Uso aceptable" },
    {
      type: "p",
      text: "Al usar BeTacora, te comprometes a no:",
    },
    {
      type: "ul",
      items: [
        "Proporcionar información falsa o suplantar la identidad de terceros.",
        "Utilizar el Servicio con fines ilegales o fraudulentos.",
        "Intentar acceder sin autorización a sistemas, cuentas de otros usuarios o datos que no te pertenezcan.",
        "Realizar ingeniería inversa, extraer datos masivamente (scraping) o interferir con el funcionamiento normal del Servicio.",
        "Revender o redistribuir el contenido generado por la App con fines comerciales sin autorización expresa.",
      ],
    },
    { type: "h2", text: "5. Itinerarios generados por IA" },
    {
      type: "p",
      text: "Los itinerarios, recomendaciones y contenidos generados por la inteligencia artificial de BeTacora son sugerencias orientativas. No garantizamos:",
    },
    {
      type: "ul",
      items: [
        "La disponibilidad, horarios, precios o exactitud absoluta de la información sobre lugares, actividades o precios estimados incluidos en el itinerario (salvo las ofertas de vuelos/actividades reales mostradas explícitamente como tales, provenientes de nuestros proveedores integrados).",
        "Que las recomendaciones sean adecuadas para cualquier circunstancia personal, médica, climática o de seguridad. Recomendamos siempre verificar la información oficial de tu destino (visados, vacunas, seguridad, clima) antes de viajar.",
      ],
    },
    { type: "h2", text: "6. Servicios de terceros (vuelos, actividades, etc.)" },
    {
      type: "p",
      text: "Cuando seleccionas y/o reservas un vuelo, actividad u otro servicio a través de BeTacora:",
    },
    {
      type: "ul",
      items: [
        "La disponibilidad, el precio final, las condiciones de la tarifa, y la política de cancelación/reembolso son establecidas por el proveedor del servicio (aerolínea, operador turístico, etc.), no por BeTacora.",
        "BeTacora no es responsable de cancelaciones, retrasos, cambios de precio, denegación de embarque, o cualquier incidencia relacionada con la prestación del servicio por parte del proveedor externo.",
        "Cualquier reclamación relativa a la prestación del servicio debe dirigirse directamente al proveedor correspondiente, sin perjuicio de que BeTacora pueda ayudarte a facilitar el contacto.",
        "[Cuando exista flujo de pago real, esta sección deberá ampliarse con condiciones específicas de pago, comisiones, moneda, y política de reembolsos de BeTacora, si aplica].",
      ],
    },
    { type: "h2", text: "7. Propiedad intelectual" },
    {
      type: "ul",
      items: [
        'El software, diseño, marca "BeTacora", logotipos y contenidos propios de la App son propiedad de [NOMBRE LEGAL DE LA EMPRESA] o de sus licenciantes, y están protegidos por la normativa de propiedad intelectual aplicable.',
        "Los itinerarios generados para tu uso personal puedes utilizarlos y compartirlos libremente para tus propios viajes.",
        "No se permite copiar, modificar o distribuir el software o diseño de la App sin autorización previa por escrito.",
      ],
    },
    { type: "h2", text: "8. Limitación de responsabilidad" },
    {
      type: "p",
      text: "En la máxima medida permitida por la ley:",
    },
    {
      type: "ul",
      items: [
        'BeTacora se ofrece "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas.',
        "No seremos responsables de daños indirectos, incidentales o consecuentes derivados del uso del Servicio, incluyendo pérdidas económicas relacionadas con viajes planificados a través de la App.",
        "Esta limitación no excluye responsabilidades que no puedan excluirse conforme a la legislación de protección al consumidor aplicable en tu jurisdicción.",
      ],
    },
    { type: "h2", text: "9. Modificaciones del servicio" },
    {
      type: "p",
      text: "Podemos modificar, suspender o discontinuar (total o parcialmente) el Servicio en cualquier momento. Intentaremos avisar con antelación razonable de cambios significativos que afecten a funcionalidades esenciales.",
    },
    { type: "h2", text: "10. Modificación de estos términos" },
    {
      type: "p",
      text: "Podemos actualizar estos Términos ocasionalmente. Si los cambios son sustanciales, te lo notificaremos por email o mediante un aviso en la app antes de que entren en vigor. El uso continuado del Servicio tras la notificación implica la aceptación de los nuevos términos.",
    },
    { type: "h2", text: "11. Legislación aplicable y jurisdicción" },
    {
      type: "p",
      text: "Estos Términos se rigen por la legislación de [PAÍS/JURISDICCIÓN — ej. España]. Cualquier disputa se someterá a los tribunales de [CIUDAD/PAÍS], salvo que la normativa de protección al consumidor aplicable establezca un fuero distinto obligatorio a favor del usuario.",
    },
    { type: "h2", text: "12. Contacto" },
    {
      type: "p",
      text: "Para cualquier duda sobre estos Términos: [EMAIL DE CONTACTO]",
    },
  ],
};

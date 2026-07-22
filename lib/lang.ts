export type AppLang = "es" | "en" | "fr";

const VALID: AppLang[] = ["es", "en", "fr"];

export function isAppLang(value: string | null): value is AppLang {
  return value === "es" || value === "en" || value === "fr";
}

/** localStorage first, then browser language, then fallback */
export function detectLang(fallback: AppLang = "en"): AppLang {
  if (typeof window === "undefined") return fallback;

  const saved = localStorage.getItem("bt_lang");
  if (isAppLang(saved)) return saved;

  const nav = (navigator.language || "").toLowerCase();
  if (nav.startsWith("fr")) return "fr";
  if (nav.startsWith("en")) return "en";
  if (nav.startsWith("es")) return "es";

  return fallback;
}

export function persistLang(lang: AppLang): void {
  localStorage.setItem("bt_lang", lang);
}

export const LANDING_COPY: Record<
  AppLang,
  { tagline: string; sub: string; cta: string }
> = {
  es: {
    tagline: "Tu bitácora inteligente de viajes",
    sub: "Descubre tu perfil viajero y genera itinerarios hechos a tu medida.",
    cta: "Descubre tu perfil viajero",
  },
  en: {
    tagline: "Your smart travel logbook",
    sub: "Discover your traveler profile and get itineraries made for you.",
    cta: "Discover your traveler profile",
  },
  fr: {
    tagline: "Votre carnet de voyage intelligent",
    sub: "Découvrez votre profil voyageur et des itinéraires sur mesure.",
    cta: "Découvrez votre profil voyageur",
  },
};

export const INSTALL_COPY: Record<
  AppLang,
  {
    button: string;
    iosTitle: string;
    iosSteps: string;
    iosShareLabel: string;
    iosHomeLabel: string;
    iosHint: string;
    close: string;
  }
> = {
  es: {
    button: "Instalar App",
    iosTitle: "Instalar BeTacora",
    iosSteps: "Toca compartir → Añadir a inicio",
    iosShareLabel: "Compartir",
    iosHomeLabel: "Añadir a inicio",
    iosHint:
      "En Safari, toca el botón Compartir (cuadrado con flecha) y elige «Añadir a pantalla de inicio».",
    close: "Entendido",
  },
  en: {
    button: "Install App",
    iosTitle: "Install BeTacora",
    iosSteps: "Tap Share → Add to Home Screen",
    iosShareLabel: "Share",
    iosHomeLabel: "Add to Home",
    iosHint:
      "In Safari, tap the Share button (square with arrow), then choose “Add to Home Screen”.",
    close: "Got it",
  },
  fr: {
    button: "Installer l'app",
    iosTitle: "Installer BeTacora",
    iosSteps: "Touchez Partager → Sur l'écran d'accueil",
    iosShareLabel: "Partager",
    iosHomeLabel: "Écran d'accueil",
    iosHint:
      "Dans Safari, touchez Partager (carré avec flèche), puis « Sur l'écran d'accueil ».",
    close: "Compris",
  },
};

export type AuthCopy = {
  back: string;
  loginSubtitle: string;
  registerSubtitle: string;
  tabLogin: string;
  tabRegister: string;
  fullName: string;
  namePlaceholder: string;
  nationality: string;
  nationalityPlaceholder: string;
  clearCountry: string;
  email: string;
  emailPlaceholder: string;
  password: string;
  passwordPlaceholderLogin: string;
  passwordPlaceholderRegister: string;
  terms: string;
  privacy: string;
  age18: string;
  submitLogin: string;
  submitRegister: string;
  loading: string;
  footer: string;
  confirmTitle: string;
  confirmHint: string;
  resend: string;
  resending: string;
  resendSuccess: string;
  errors: {
    nameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    passwordRequired: string;
    passwordShort: string;
    nationalityRequired: string;
    termsRequired: string;
    privacyRequired: string;
    ageRequired: string;
    resendNeedEmail: string;
    emailNotConfirmed: string;
  };
};

export const AUTH_COPY: Record<AppLang, AuthCopy> = {
  es: {
    back: "Volver",
    loginSubtitle: "Inicia sesión para guardar tus itinerarios",
    registerSubtitle: "Crea tu cuenta y desbloquea más generaciones",
    tabLogin: "Entrar",
    tabRegister: "Registrarse",
    fullName: "Nombre completo",
    namePlaceholder: "Tu nombre",
    nationality: "Nacionalidad",
    nationalityPlaceholder: "Busca tu país...",
    clearCountry: "Quitar país",
    email: "Email",
    emailPlaceholder: "tu@email.com",
    password: "Contraseña",
    passwordPlaceholderLogin: "Tu contraseña",
    passwordPlaceholderRegister: "Mínimo 8 caracteres",
    terms: "Acepto los términos y condiciones",
    privacy: "Acepto la política de privacidad",
    age18: "Tengo más de 18 años",
    submitLogin: "Entrar",
    submitRegister: "Crear cuenta",
    loading: "…",
    footer: "Sin cuenta: 1 itinerario · Con cuenta: 2 por mes",
    confirmTitle: "Revisa tu email y confirma tu cuenta",
    confirmHint: "Te hemos enviado un enlace de confirmación.",
    resend: "Reenviar email de confirmación",
    resending: "Enviando…",
    resendSuccess:
      "Te hemos reenviado el email de confirmación. Revisa tu bandeja de entrada.",
    errors: {
      nameRequired: "Introduce tu nombre.",
      emailRequired: "Introduce tu email.",
      emailInvalid: "Introduce un email válido.",
      passwordRequired: "Introduce una contraseña.",
      passwordShort: "La contraseña debe tener al menos 8 caracteres.",
      nationalityRequired: "Selecciona tu nacionalidad.",
      termsRequired: "Debes aceptar los términos y condiciones.",
      privacyRequired: "Debes aceptar la política de privacidad.",
      ageRequired: "Debes confirmar que tienes más de 18 años.",
      resendNeedEmail: "Introduce tu email para reenviar la confirmación.",
      emailNotConfirmed:
        "Tu email aún no está confirmado. Revisa tu bandeja de entrada.",
    },
  },
  en: {
    back: "Back",
    loginSubtitle: "Sign in to save your itineraries",
    registerSubtitle: "Create your account and unlock more generations",
    tabLogin: "Sign in",
    tabRegister: "Sign up",
    fullName: "Full name",
    namePlaceholder: "Your name",
    nationality: "Nationality",
    nationalityPlaceholder: "Search your country...",
    clearCountry: "Clear country",
    email: "Email",
    emailPlaceholder: "you@email.com",
    password: "Password",
    passwordPlaceholderLogin: "Your password",
    passwordPlaceholderRegister: "At least 8 characters",
    terms: "I accept the terms and conditions",
    privacy: "I accept the privacy policy",
    age18: "I am over 18 years old",
    submitLogin: "Sign in",
    submitRegister: "Create account",
    loading: "…",
    footer: "No account: 1 itinerary · With account: 2 per month",
    confirmTitle: "Check your email and confirm your account",
    confirmHint: "We've sent you a confirmation link.",
    resend: "Resend confirmation email",
    resending: "Sending…",
    resendSuccess:
      "We've resent the confirmation email. Check your inbox.",
    errors: {
      nameRequired: "Enter your name.",
      emailRequired: "Enter your email.",
      emailInvalid: "Enter a valid email.",
      passwordRequired: "Enter a password.",
      passwordShort: "Password must be at least 8 characters.",
      nationalityRequired: "Select your nationality.",
      termsRequired: "You must accept the terms and conditions.",
      privacyRequired: "You must accept the privacy policy.",
      ageRequired: "You must confirm you are over 18.",
      resendNeedEmail: "Enter your email to resend confirmation.",
      emailNotConfirmed:
        "Your email is not confirmed yet. Check your inbox.",
    },
  },
  fr: {
    back: "Retour",
    loginSubtitle: "Connectez-vous pour enregistrer vos itinéraires",
    registerSubtitle: "Créez votre compte et débloquez plus de générations",
    tabLogin: "Connexion",
    tabRegister: "S'inscrire",
    fullName: "Nom complet",
    namePlaceholder: "Votre nom",
    nationality: "Nationalité",
    nationalityPlaceholder: "Recherchez votre pays...",
    clearCountry: "Retirer le pays",
    email: "Email",
    emailPlaceholder: "vous@email.com",
    password: "Mot de passe",
    passwordPlaceholderLogin: "Votre mot de passe",
    passwordPlaceholderRegister: "Au moins 8 caractères",
    terms: "J'accepte les conditions générales",
    privacy: "J'accepte la politique de confidentialité",
    age18: "J'ai plus de 18 ans",
    submitLogin: "Se connecter",
    submitRegister: "Créer un compte",
    loading: "…",
    footer: "Sans compte : 1 itinéraire · Avec compte : 2 par mois",
    confirmTitle: "Vérifiez votre email et confirmez votre compte",
    confirmHint: "Nous vous avons envoyé un lien de confirmation.",
    resend: "Renvoyer l'email de confirmation",
    resending: "Envoi…",
    resendSuccess:
      "Nous avons renvoyé l'email de confirmation. Vérifiez votre boîte de réception.",
    errors: {
      nameRequired: "Entrez votre nom.",
      emailRequired: "Entrez votre email.",
      emailInvalid: "Entrez un email valide.",
      passwordRequired: "Entrez un mot de passe.",
      passwordShort: "Le mot de passe doit contenir au moins 8 caractères.",
      nationalityRequired: "Sélectionnez votre nationalité.",
      termsRequired: "Vous devez accepter les conditions générales.",
      privacyRequired: "Vous devez accepter la politique de confidentialité.",
      ageRequired: "Vous devez confirmer que vous avez plus de 18 ans.",
      resendNeedEmail:
        "Entrez votre email pour renvoyer la confirmation.",
      emailNotConfirmed:
        "Votre email n'est pas encore confirmé. Vérifiez votre boîte de réception.",
    },
  },
};

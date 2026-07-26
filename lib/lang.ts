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
  { tagline: string; sub: string; cta: string; ctaReturning: string; about: string }
> = {
  es: {
    tagline: "Tu bitácora inteligente de viajes",
    sub: "Descubre tu perfil viajero y genera itinerarios a tu medida. Todo queda en tu bitácora.",
    cta: "Descubre tu perfil viajero",
    ctaReturning: "Empezar nuevo viaje",
    about: "Sobre nosotros",
  },
  en: {
    tagline: "Your smart travel logbook",
    sub: "Discover your traveler profile and get itineraries made for you.",
    cta: "Discover your traveler profile",
    ctaReturning: "Start a new trip",
    about: "About",
  },
  fr: {
    tagline: "Votre carnet de voyage intelligent",
    sub: "Découvrez votre profil voyageur et des itinéraires sur mesure.",
    cta: "Découvrez votre profil voyageur",
    ctaReturning: "Commencer un nouveau voyage",
    about: "À propos",
  },
};

export const INSTALL_COPY: Record<
  AppLang,
  {
    button: string;
    buttonShort: string;
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
    buttonShort: "Instalar",
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
    buttonShort: "Install",
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
    buttonShort: "Installer",
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
  continueWithGoogle: string;
  orEmail: string;
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
  confirmTitle: string;
  confirmHint: string;
  confirmedTitle: string;
  confirmedHint: string;
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
    oauthFailed: string;
    confirmFailed: string;
  };
};

export type NavTabId = "inicio" | "explorar" | "guia" | "viajes" | "perfil";

export const NAV_COPY: Record<
  AppLang,
  {
    tabs: Record<NavTabId, string>;
    inicio: {
      greetingNamed: string;
      greetingGeneric: string;
      sub: string;
      startTrip: string;
      discoverProfile: string;
      viewProfile: string;
      myTrips: string;
    };
    guia: {
      title: string;
      body: string;
    };
    viajes: {
      title: string;
      emptyTitle: string;
      emptyBody: string;
      emptyCta: string;
      loginTitle: string;
      loginBody: string;
      loginCta: string;
      openTrip: string;
      untitled: string;
      loading: string;
    };
    perfil: {
      title: string;
      eyebrow: string;
      emptyTitle: string;
      emptyCta: string;
      updateProfile: string;
      loginTitle: string;
      loginBody: string;
      loginCta: string;
      loading: string;
      logout: string;
      statMotiv: string;
      statEnergy: string;
      statPace: string;
    };
  }
> = {
  es: {
    tabs: {
      inicio: "Inicio",
      explorar: "Explorar",
      guia: "Guía",
      viajes: "Mis Viajes",
      perfil: "Perfil",
    },
    inicio: {
      greetingNamed: "Hola, {name}",
      greetingGeneric: "Bienvenido a BeTacora",
      sub: "Tu bitácora inteligente de viajes.",
      startTrip: "Empezar nuevo viaje",
      discoverProfile: "Descubre tu perfil viajero",
      viewProfile: "Ver mi perfil",
      myTrips: "Mis viajes",
    },
    guia: {
      title: "Próximamente: tu guía de viaje",
      body: "Estamos preparando guías virtuales, híbridas y presenciales personalizadas para tu estilo de viajar.",
    },
    viajes: {
      title: "Mis Viajes",
      emptyTitle: "Aún no tienes viajes guardados",
      emptyBody: "Explora y genera tu primera bitácora inteligente.",
      emptyCta: "Explorar",
      loginTitle: "Inicia sesión para ver tus viajes",
      loginBody: "Tus itinerarios se guardan en tu cuenta.",
      loginCta: "Iniciar sesión",
      openTrip: "Ver itinerario",
      untitled: "Viaje sin destino",
      loading: "Cargando viajes…",
    },
    perfil: {
      title: "Perfil",
      eyebrow: "✦ Tu Bitácora Viajera",
      emptyTitle: "Descubre tu identidad viajera",
      emptyCta: "Descubre tu identidad viajera",
      updateProfile: "Actualizar mi perfil",
      loginTitle: "Inicia sesión para ver tu perfil",
      loginBody: "Tu arquetipo viajero vive en tu cuenta.",
      loginCta: "Iniciar sesión",
      loading: "Cargando perfil…",
      logout: "Cerrar sesión",
      statMotiv: "Motivación",
      statEnergy: "Energía",
      statPace: "Ritmo",
    },
  },
  en: {
    tabs: {
      inicio: "Home",
      explorar: "Explore",
      guia: "Guide",
      viajes: "My Trips",
      perfil: "Profile",
    },
    inicio: {
      greetingNamed: "Hello, {name}",
      greetingGeneric: "Welcome to BeTacora",
      sub: "Your smart travel logbook.",
      startTrip: "Start a new trip",
      discoverProfile: "Discover your traveler profile",
      viewProfile: "View my profile",
      myTrips: "My trips",
    },
    guia: {
      title: "Coming soon: your travel guide",
      body: "We're building virtual, hybrid, and in-person guides tailored to how you travel.",
    },
    viajes: {
      title: "My Trips",
      emptyTitle: "No saved trips yet",
      emptyBody: "Explore and generate your first smart itinerary.",
      emptyCta: "Explore",
      loginTitle: "Sign in to see your trips",
      loginBody: "Your itineraries are saved to your account.",
      loginCta: "Sign in",
      openTrip: "View itinerary",
      untitled: "Trip without destination",
      loading: "Loading trips…",
    },
    perfil: {
      title: "Profile",
      eyebrow: "✦ Your Travel Logbook",
      emptyTitle: "Discover your traveler identity",
      emptyCta: "Discover your traveler identity",
      updateProfile: "Update my profile",
      loginTitle: "Sign in to see your profile",
      loginBody: "Your traveler archetype lives in your account.",
      loginCta: "Sign in",
      loading: "Loading profile…",
      logout: "Sign out",
      statMotiv: "Motivation",
      statEnergy: "Energy",
      statPace: "Pace",
    },
  },
  fr: {
    tabs: {
      inicio: "Accueil",
      explorar: "Explorer",
      guia: "Guide",
      viajes: "Mes Voyages",
      perfil: "Profil",
    },
    inicio: {
      greetingNamed: "Bonjour, {name}",
      greetingGeneric: "Bienvenue sur BeTacora",
      sub: "Votre carnet de voyage intelligent.",
      startTrip: "Commencer un nouveau voyage",
      discoverProfile: "Découvrez votre profil voyageur",
      viewProfile: "Voir mon profil",
      myTrips: "Mes voyages",
    },
    guia: {
      title: "Bientôt : votre guide de voyage",
      body: "Nous préparons des guides virtuels, hybrides et en présentiel adaptés à votre façon de voyager.",
    },
    viajes: {
      title: "Mes Voyages",
      emptyTitle: "Aucun voyage enregistré",
      emptyBody: "Explorez et générez votre premier itinéraire intelligent.",
      emptyCta: "Explorer",
      loginTitle: "Connectez-vous pour voir vos voyages",
      loginBody: "Vos itinéraires sont enregistrés dans votre compte.",
      loginCta: "Se connecter",
      openTrip: "Voir l'itinéraire",
      untitled: "Voyage sans destination",
      loading: "Chargement…",
    },
    perfil: {
      title: "Profil",
      eyebrow: "✦ Votre Carnet de Voyage",
      emptyTitle: "Découvrez votre identité voyageuse",
      emptyCta: "Découvrez votre identité voyageuse",
      updateProfile: "Mettre à jour mon profil",
      loginTitle: "Connectez-vous pour voir votre profil",
      loginBody: "Votre archétype voyageur vit dans votre compte.",
      loginCta: "Se connecter",
      loading: "Chargement…",
      logout: "Se déconnecter",
      statMotiv: "Motivation",
      statEnergy: "Énergie",
      statPace: "Rythme",
    },
  },
};


export const AUTH_COPY: Record<AppLang, AuthCopy> = {
  es: {
    back: "Volver",
    loginSubtitle: "Inicia sesión para guardar tus viajes en tu bitácora",
    registerSubtitle: "Crea tu cuenta y empieza a construir tu bitácora",
    tabLogin: "Entrar",
    tabRegister: "Registrarse",
    continueWithGoogle: "Continuar con Google",
    orEmail: "o con email",
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
    confirmTitle: "Revisa tu email y confirma tu cuenta",
    confirmHint: "Te hemos enviado un enlace de confirmación.",
    confirmedTitle: "¡Cuenta confirmada!",
    confirmedHint: "Entrando en tu bitácora…",
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
      oauthFailed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
      confirmFailed:
        "No pudimos confirmar tu cuenta. El enlace puede haber caducado. Prueba a iniciar sesión o reenviar el email.",
    },
  },
  en: {
    back: "Back",
    loginSubtitle: "Sign in to save your itineraries",
    registerSubtitle: "Create your account and unlock more generations",
    tabLogin: "Sign in",
    tabRegister: "Sign up",
    continueWithGoogle: "Continue with Google",
    orEmail: "or with email",
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
    confirmTitle: "Check your email and confirm your account",
    confirmHint: "We've sent you a confirmation link.",
    confirmedTitle: "Account confirmed!",
    confirmedHint: "Taking you to your logbook…",
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
      oauthFailed: "Sign-in failed. Please try again.",
      confirmFailed:
        "We couldn't confirm your account. The link may have expired. Try signing in or resending the email.",
    },
  },
  fr: {
    back: "Retour",
    loginSubtitle: "Connectez-vous pour enregistrer vos itinéraires",
    registerSubtitle: "Créez votre compte et débloquez plus de générations",
    tabLogin: "Connexion",
    tabRegister: "S'inscrire",
    continueWithGoogle: "Continuer avec Google",
    orEmail: "ou avec email",
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
    confirmTitle: "Vérifiez votre email et confirmez votre compte",
    confirmHint: "Nous vous avons envoyé un lien de confirmation.",
    confirmedTitle: "Compte confirmé !",
    confirmedHint: "Ouverture de votre carnet…",
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
      oauthFailed: "La connexion a échoué. Réessayez.",
      confirmFailed:
        "Impossible de confirmer votre compte. Le lien a peut-être expiré. Essayez de vous connecter ou de renvoyer l'email.",
    },
  },
};

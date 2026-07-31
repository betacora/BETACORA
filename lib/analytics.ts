import { track } from "@vercel/analytics/react";

/** Funnel events for drop-off analysis (Vercel Web Analytics custom events). */
export const FunnelEvent = {
  LandingPageView: "landing_page_view",
  QuestionnaireStarted: "questionnaire_started",
  QuestionnaireCompleted: "questionnaire_completed",
  ItineraryGenerated: "itinerary_generated",
  ItineraryPaywallView: "itinerary_paywall_view",
  ItineraryPaywallUnlockClick: "itinerary_paywall_unlock_click",
  RegistrationStarted: "registration_started",
  RegistrationCompleted: "registration_completed",
  OnboardingWelcomeViewed: "onboarding_welcome_viewed",
  AssistantChatOpen: "assistant_chat_open",
  AssistantChatMessage: "assistant_chat_message",
  AssistantActionClick: "assistant_action_click",
} as const;

export type FunnelEventName = (typeof FunnelEvent)[keyof typeof FunnelEvent];

export type AnalyticsProps = Record<string, string | number | boolean | null>;

/** postMessage type used by questionnaire.html → React parent bridge. */
export const ANALYTICS_MESSAGE_TYPE = "bt:analytics";

/** Fire a named funnel event (never throws into product UI). */
export function trackFunnel(
  event: FunnelEventName | string,
  props?: AnalyticsProps
): void {
  try {
    if (props) track(event, props);
    else track(event);
  } catch {
    // Analytics must never break the product UI
  }
}

/** @deprecated Use trackFunnel — kept as alias for call-site clarity. */
export const trackEvent = trackFunnel;
export const AnalyticsEvents = {
  LANDING_PAGE_VIEW: FunnelEvent.LandingPageView,
  QUESTIONNAIRE_STARTED: FunnelEvent.QuestionnaireStarted,
  QUESTIONNAIRE_COMPLETED: FunnelEvent.QuestionnaireCompleted,
  ITINERARY_GENERATED: FunnelEvent.ItineraryGenerated,
  ITINERARY_PAYWALL_VIEW: FunnelEvent.ItineraryPaywallView,
  ITINERARY_PAYWALL_UNLOCK_CLICK: FunnelEvent.ItineraryPaywallUnlockClick,
  REGISTRATION_STARTED: FunnelEvent.RegistrationStarted,
  REGISTRATION_COMPLETED: FunnelEvent.RegistrationCompleted,
} as const;

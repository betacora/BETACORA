/**
 * Client-side mirror of lib/sanitize-itinerary-html.ts (defense in depth).
 * Server already sanitizes on generate/share; this protects draft restore & older HTML.
 */
(function () {
  "use strict";

  var TRUSTED_HREF_PREFIXES = [
    "https://www.google.com/maps/dir/?",
    "https://www.google.com/maps/search/?",
    "https://www.google.com/maps/place/",
    "https://maps.google.com/maps?",
    "https://www.duffel.com/",
    "https://api.duffel.com/",
    "https://www.viator.com/",
  ];

  var ALLOWED_TAGS = {
    h2: 1, h3: 1, p: 1, ul: 1, ol: 1, li: 1, strong: 1, em: 1, b: 1, i: 1,
    div: 1, span: 1, br: 1, a: 1,
  };

  var ALLOWED_CLASSES = {
    "day-meta": 1, "profile-result": 1, "profile-stats": 1, "profile-stat": 1,
    "section-card": 1, "bt-take-me": 1, "bt-take-me-icon": 1, price: 1, highlight: 1,
  };

  function isTrustedHref(href) {
    var trimmed = String(href || "").trim();
    if (!trimmed || trimmed.charAt(0) === "#") return false;
    if (trimmed.charAt(0) === "/" && trimmed.indexOf("//") !== 0) {
      return /^\/(auth|explorar|viaje|inicio|viajes|perfil)(\?|$|\/)/i.test(trimmed);
    }
    try {
      var url = new URL(trimmed);
      if (url.protocol !== "https:") return false;
      var absolute = url.href;
      for (var i = 0; i < TRUSTED_HREF_PREFIXES.length; i++) {
        if (absolute.indexOf(TRUSTED_HREF_PREFIXES[i]) === 0) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function stripDangerousUrlText(text) {
    return String(text)
      .replace(/https?:\/\/[^\s<>"']+/gi, "")
      .replace(/\bwww\.[^\s<>"']+/gi, "");
  }

  function sanitizeItineraryHtml(html, options) {
    if (!html || typeof html !== "string") return "";
    options = options || {};
    var keepPlaces = options.keepPlacesScript === true;
    var stripUrls = options.stripUntrustedUrlsInText !== false;

    var placesBlock = "";
    var body = html;
    var placesRe = /<script\b[^>]*\bid\s*=\s*["']bt-places["'][^>]*>[\s\S]*?(?:<\/script>|$)/i;
    var placesMatch = body.match(placesRe);
    if (placesMatch) {
      placesBlock = placesMatch[0];
      body = body.replace(placesRe, "");
    }

    body = body
      .replace(/<script\b[\s\S]*?<\/script>/gi, "")
      .replace(/<script\b[^>]*>/gi, "")
      .replace(/<\/script>/gi, "")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "")
      .replace(/<(iframe|object|embed|form|input|textarea|button|link|meta|base|svg)\b[\s\S]*?<\/\1>/gi, "")
      .replace(/<(iframe|object|embed|form|input|textarea|button|link|meta|base|svg)\b[^>]*\/?>/gi, "");

    body = body.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    body = body.replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    body = body.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, function (_full, attrs, inner) {
      var hrefMatch = attrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      var href = ((hrefMatch && (hrefMatch[2] || hrefMatch[3] || hrefMatch[4])) || "").trim();
      var classMatch = attrs.match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      var className = ((classMatch && (classMatch[2] || classMatch[3] || classMatch[4])) || "").trim();
      var safeInner = stripUrls ? stripDangerousUrlText(inner) : inner;

      if (href && isTrustedHref(href)) {
        var safeClass = className
          .split(/\s+/)
          .filter(function (c) { return ALLOWED_CLASSES[c]; })
          .join(" ");
        var classAttr = safeClass ? ' class="' + safeClass + '"' : "";
        return '<a href="' + href.replace(/"/g, "&quot;") + '" target="_blank" rel="noopener noreferrer"' + classAttr + ">" + safeInner + "</a>";
      }
      return safeInner;
    });

    body = body.replace(/<\/?([a-z0-9]+)(\s[^>]*)?>/gi, function (full, rawTag, rawAttrs) {
      var tag = String(rawTag).toLowerCase();
      var closing = full.indexOf("</") === 0;
      if (!ALLOWED_TAGS[tag]) return "";
      if (tag === "br") return "<br/>";
      if (closing) return "</" + tag + ">";
      if (tag === "a") return "";

      var attrs = "";
      if (tag === "div" || tag === "p" || tag === "span") {
        var cm = String(rawAttrs || "").match(/\bclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
        var cn = ((cm && (cm[2] || cm[3] || cm[4])) || "").trim();
        var sc = cn
          .split(/\s+/)
          .filter(function (c) { return ALLOWED_CLASSES[c]; })
          .join(" ");
        if (sc) attrs = ' class="' + sc + '"';
      }
      return "<" + tag + attrs + ">";
    });

    if (stripUrls) {
      body = body.replace(/>([^<]+)</g, function (_m, text) {
        return ">" + stripDangerousUrlText(text) + "<";
      });
    }

    body = body.trim();
    if (keepPlaces && placesBlock) {
      var jsonMatch = placesBlock.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
      var json = ((jsonMatch && jsonMatch[1]) || "").trim();
      if (json.charAt(0) === "{" && json.indexOf('"places"') !== -1) {
        body += '\n<script type="application/json" id="bt-places">' + json + "</script>";
      }
    }
    return body;
  }

  window.btSanitizeItineraryHtml = sanitizeItineraryHtml;
})();

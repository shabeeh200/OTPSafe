// ruleEngine.ts
// Simple, explainable SMS scam-rule engine for Node.js
// Returns: { isScam, confidence, reasons[], suggestedAction[], triggeredRules[], redacted }

export interface RuleMatchResult {
  reason: string;
}

export interface Rule {
  name: string;
  weight: number;
  match: (msg: string, meta?: AnalysisMeta, additionalTemplates?: string[]) => RuleMatchResult | null;
}

export interface AnalysisMeta {
  sender?: string;
  country?: string;
  brandList?: string[];
}

export interface AnalysisResult {
  isScam: boolean;
  confidence: number;
  reasons: string[];
  suggestedAction: string[];
  triggeredRules: { name: string; weight: number; reason: string }[];
  redacted: string;
}

const DEFAULT_BRANDS = [
  "jazzcash", "easypaisa", "bank alfalah", "hbl", "mcbl", "allied bank", "UBL", "standard chartered", "askari"
].map(s => s.toLowerCase());

/** Utility regexes */
const RE_DIGITS_SEQ = /\d{4,}/g; // redact long digit sequences (OTP, account numbers)
const RE_CNIC = /\b\d{5}-\d{7}-\d\b/g; // pakistani CNIC format 12345-1234567-1
const RE_URL = /(https?:\/\/[^\s]+|bit\.ly\/[^\s]+|tinyurl\.com\/[^\s]+)/i;
const RE_OTP_HINT = /\b(otp|one ?time ?password|verification code|code is)\b/i;
const RE_OTP_DIGIT_NEAR = /\b(?:otp|code|verification)\b[^\d]{0,10}(\d{3,6})|\b(\d{4,6})\b[^\w]{0,10}(otp|code|verification)\b/i;
const RE_URGENCY = /\b(immediately|urgent|urgently|suspend|blocked|verify now|within 24 hours|act now|call now|last chance)\b/i;
const RE_PERSONAL = /\b(cnic|passport|password|pin|account number|account no|send your otp|share otp|share code)\b/i;
const RE_AMOUNT = /\b(rs\.?|pkr|rupees?)\s?[\d,]+/i;
const RE_SENDER_SHORTCODE = /^\d{3,6}$/; // numeric shortcodes
const RE_EMAIL = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/i;

/** Default rule definitions with starting weights (0..1). */
const RULES: Rule[] = [
  {
    name: "otp_request",
    weight: 1.0,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      if (RE_PERSONAL.test(msg)) return { reason: "Explicit request for OTP / personal secrets" };
      if (RE_OTP_HINT.test(msg) && RE_DIGITS_SEQ.test(msg)) return { reason: "Contains OTP-like code and OTP keyword" };
      if (RE_OTP_DIGIT_NEAR.test(msg)) return { reason: "Code near OTP/verification keywords" };
      return null;
    }
  },
  {
    name: "personal_info_request",
    weight: 1.0,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      if (RE_PERSONAL.test(msg) && !/balance/i.test(msg)) return { reason: "Requests personal info (CNIC / password / account)" };
      if (RE_CNIC.test(msg)) return { reason: "Contains CNIC pattern" };
      return null;
    }
  },
  {
    name: "suspicious_url",
    weight: 0.7,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      return RE_URL.test(msg) ? { reason: "Contains a link or shortened URL" } : null;
    }
  },
  {
    name: "urgency",
    weight: 0.6,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      return RE_URGENCY.test(msg) ? { reason: "Urgency language used (e.g. 'immediately', 'suspend')" } : null;
    }
  },
  {
    name: "brand_impersonation",
    weight: 0.6,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      const lower = msg.toLowerCase();
      const brandList = meta?.brandList || DEFAULT_BRANDS;
      for (const b of brandList) {
        if (lower.includes(b) && /(verify|suspend|click|link|otp|account)/i.test(lower)) {
          return { reason: `Mentions brand '${b}' with action request` };
        }
      }
      return null;
    }
  },
  {
    name: "shortcode_sender",
    weight: 0.5,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      if (meta?.sender && RE_SENDER_SHORTCODE.test(meta.sender)) {
        return { reason: `Sender looks like a numeric shortcode: '${meta.sender}'` };
      }
      return null;
    }
  },
  {
    name: "amount_lure",
    weight: 0.5,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      return RE_AMOUNT.test(msg) ? { reason: "Mentions money / refund / unexpected credit" } : null;
    }
  },
  {
    name: "poor_grammar",
    weight: 0.2,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      // very simple heuristic: many non-word characters or multiple '!!!' etc
      const punctuationCount = (msg.match(/[!?.]{2,}/g) || []).length;
      const oddSpacing = /( {2,})/.test(msg);
      if (punctuationCount > 0 || oddSpacing) return { reason: "Unusual punctuation/formatting (possible scam grammar)" };
      return null;
    }
  },
  {
    name: "email_present",
    weight: 0.4,
    match: (msg: string, meta?: AnalysisMeta): RuleMatchResult | null => {
      return RE_EMAIL.test(msg) ? { reason: "Contains an email address (often used in scam contact)" } : null;
    }
  }
];

/** Redact PII (use before sending to any external LLM) */
function redactPII(message: string): string {
  if (!message) return "";
  return message
    .replace(RE_CNIC, "<CNIC>")
    .replace(RE_EMAIL, "<EMAIL>")
    .replace(RE_DIGITS_SEQ, "<DIGIT>");
}

/** Compute combined confidence using product formula */
function computeConfidence(weights: number[]): number {
  if (!weights || weights.length === 0) return 0;
  const prod = weights.reduce((p, w) => p * (1 - w), 1);
  return Number((1 - prod).toFixed(3));
}

interface AnalyzeSmsParams {
  message?: string;
  sender?: string;
  country?: string;
  additionalTemplates?: string[];
}

/** Main analyze function */
function analyzeSms({ message = "", sender = "", country = "PK", additionalTemplates = [] }: AnalyzeSmsParams): AnalysisResult {
  // keep original trimmed text for rule matching (so regexes like RE_URL still work)
  const original = (message || "").trim();

  // prepare a normalized version for redaction/LLM that reduces noise for LLM
  let normalized = original;

  // If there are URLs present in the original, replace them in normalized with a token,
  // but do NOT remove them from the original used for rule matching.
  const urlMatches = original.match(RE_URL);
  if (urlMatches && urlMatches.length) {
    normalized = normalized.replace(RE_URL, ' <URL> ');
  }

  // Remove weird punctuation from normalized only (keep original intact for rules)
  normalized = normalized.replace(/[^\p{L}\p{N}\s<>@.:\/\\-]/gu, ' ');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  // Use original for early short-circuits that should be applied before heavy LLM work
  if (!original || original.length < 4) {
    return {
      isScam: false,
      confidence: 0,
      reasons: ['Message empty or too short'],
      suggestedAction: ['monitor'],
      triggeredRules: [],
      redacted: redactPII(normalized)
    };
  }

  // emoji-only / whitespace-only based on normalized (safe)
  if (/^[\p{Emoji}\s]+$/u.test(normalized)) {
    return {
      isScam: false,
      confidence: 0,
      reasons: ['Message appears to contain only emojis/whitespace'],
      suggestedAction: ['monitor'],
      triggeredRules: [],
      redacted: redactPII(normalized)
    };
  }

  if (original.length > 2000) {
    return {
      isScam: false,
      confidence: 0,
      reasons: ['Message too long'],
      suggestedAction: ['monitor'],
      triggeredRules: [],
      redacted: redactPII(normalized)
    };
  }

  // Now run rules against the ORIGINAL (not the normalized) text so regexes keep working.
  const meta: AnalysisMeta = { sender, country, brandList: [...DEFAULT_BRANDS] };
  const triggered: { name: string; weight: number; reason: string }[] = [];
  const weights: number[] = [];

  for (const rule of RULES) {
    try {
      const res = rule.match(original, meta, additionalTemplates); // <-- important: original
      if (res) {
        triggered.push({ name: rule.name, weight: rule.weight, reason: res.reason });
        weights.push(rule.weight);
      }
    } catch (e) {
      console.error(`Error in rule ${rule.name}:`, e);
    }
  }

  // optional: additional templates matching against original text
  if (additionalTemplates && Array.isArray(additionalTemplates)) {
    for (const t of additionalTemplates) {
      if (t && typeof t === "string" && original.toLowerCase().includes(t.toLowerCase())) {
        triggered.push({ name: "known_template", weight: 0.8, reason: `Matches known scam template: "${t}"` });
        weights.push(0.8);
      }
    }
  }

  // compute confidence, handle OTP/personal override
  const hasOtpOrPersonal = triggered.some(r => r.name === "otp_request" || r.name === "personal_info_request");
  let confidence = computeConfidence(weights);
  if (hasOtpOrPersonal) confidence = Math.max(confidence, 0.99);

  const threshold = 0.6;
  const isScam = confidence >= threshold;

  // Suggested actions
  const suggestedAction: string[] = [];
  if (triggered.some(r => r.name === "otp_request" || r.name === "personal_info_request")) {
    suggestedAction.push("do_not_share_otp_or_secrets");
    suggestedAction.push("contact_provider_directly");
    suggestedAction.push("report_to_fia");
  } else if (isScam) {
    suggestedAction.push("report_to_provider");
    suggestedAction.push("file_cyber_complaint");
  } else {
    suggestedAction.push("monitor");
  }

  return {
    isScam,
    confidence,
    reasons: triggered.map(t => t.reason),
    suggestedAction,
    triggeredRules: triggered,
    redacted: redactPII(normalized) // redact the normalized version
  };
}




/** Export */
export { analyzeSms, redactPII, RULES };
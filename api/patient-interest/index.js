const recentRequests = new Map();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9+()\-\s]{7,20}$/;
const SAFE_TEXT_REGEX = /^[a-zA-Z0-9\s.,'()\-]{2,120}$/;

const ALLOWED_SERVICES = new Set([
  'AI-Assisted Report Understanding',
  'Clinician-Reviewed Guidance',
  'Expert Second Opinion',
  'Longitudinal Patient Vault',
  'Caregiver Support',
  'General Product Updates',
]);

const DISALLOWED_HEALTH_TERMS = [
  'diagnosis',
  'diagnosed',
  'prescription',
  'symptom',
  'symptoms',
  'scan report',
  'blood report',
  'mri',
  'ct scan',
  'x-ray',
  'medical history',
  'treatment plan',
  'hospital report',
  'patient id',
];

const ALLOWED_ORIGINS = new Set([
  'https://www.contextworksdigital.com',
  'https://contextworksdigital.com',
  'http://localhost:4280',
  'http://localhost:3000',
]);

function getAllowedOrigin(req) {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && ALLOWED_ORIGINS.has(origin)) {
    return origin;
  }

  return 'https://www.contextworksdigital.com';
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const history = recentRequests.get(ip) || [];
  const valid = history.filter((ts) => now - ts <= RATE_LIMIT_WINDOW_MS);

  if (valid.length >= RATE_LIMIT_MAX) {
    recentRequests.set(ip, valid);
    return true;
  }

  valid.push(now);
  recentRequests.set(ip, valid);
  return false;
}

function hasDisallowedTerms(payload) {
  const fieldsToScan = [
    payload.fullName,
    payload.city,
    payload.preferredLanguage,
    ...(Array.isArray(payload.services) ? payload.services : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return DISALLOWED_HEALTH_TERMS.some((term) => fieldsToScan.includes(term));
}

function sanitizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return 'redacted';
  }

  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function maskMobile(mobile) {
  const digits = mobile.replace(/\D/g, '');
  if (digits.length < 4) {
    return 'redacted';
  }

  return `***${digits.slice(-4)}`;
}

module.exports = async function (context, req) {
  const allowedOrigin = getAllowedOrigin(req);

  context.res = {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 200;
    context.res.body = { success: true };
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    context.res.status = 429;
    context.res.body = {
      success: false,
      message: 'Too many submissions. Please try again after some time.',
    };
    return;
  }

  const body = req.body || {};

  if (body.website && String(body.website).trim()) {
    context.res.status = 200;
    context.res.body = {
      success: true,
      message: 'Thank you for registering your interest.',
    };
    return;
  }

  const fullName = sanitizeText(body.fullName);
  const city = sanitizeText(body.city);
  const email = sanitizeText(body.email).toLowerCase();
  const mobile = sanitizeText(body.mobile);
  const preferredLanguage = sanitizeText(body.preferredLanguage);
  const services = Array.isArray(body.services) ? body.services.map((item) => sanitizeText(item)).filter(Boolean) : [];
  const consent = body.consent === true;

  if (!fullName || !city || !email || !mobile || !preferredLanguage || !services.length || !consent) {
    context.res.status = 400;
    context.res.body = {
      success: false,
      message: 'Please complete all required fields and consent.',
    };
    return;
  }

  if (!SAFE_TEXT_REGEX.test(fullName) || !SAFE_TEXT_REGEX.test(city) || !SAFE_TEXT_REGEX.test(preferredLanguage)) {
    context.res.status = 400;
    context.res.body = {
      success: false,
      message: 'Please enter valid text values in required fields.',
    };
    return;
  }

  if (!EMAIL_REGEX.test(email)) {
    context.res.status = 400;
    context.res.body = {
      success: false,
      message: 'Please provide a valid email address.',
    };
    return;
  }

  if (!MOBILE_REGEX.test(mobile)) {
    context.res.status = 400;
    context.res.body = {
      success: false,
      message: 'Please provide a valid mobile number.',
    };
    return;
  }

  if (services.some((item) => !ALLOWED_SERVICES.has(item))) {
    context.res.status = 400;
    context.res.body = {
      success: false,
      message: 'One or more selected services are invalid.',
    };
    return;
  }

  if (hasDisallowedTerms({ fullName, city, preferredLanguage, services })) {
    context.res.status = 400;
    context.res.body = {
      success: false,
      message: 'Please do not submit medical or sensitive health information in this form.',
    };
    return;
  }

  context.log('Patient interest registration received', {
    timestamp: new Date().toISOString(),
    fullNameInitial: fullName.charAt(0),
    city,
    email: maskEmail(email),
    mobile: maskMobile(mobile),
    preferredLanguage,
    serviceCount: services.length,
  });

  context.res.status = 200;
  context.res.body = {
    success: true,
    message: 'Interest registered successfully.',
  };
};

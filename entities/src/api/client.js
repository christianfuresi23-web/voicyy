const STORAGE_KEYS = {
  token: 'app_token',
  user: 'app_user',
  agentRequests: 'agent_requests',
  pendingOtpEmail: 'pending_otp_email',
};

const getJson = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const setJson = (key, value) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const ensureAuthed = () => {
  const token = window.localStorage.getItem(STORAGE_KEYS.token);
  if (!token) {
    const err = new Error('Authentication required');
    err.status = 401;
    throw err;
  }
};

const nowIso = () => new Date().toISOString();

export const api = {
  auth: {
    async me() {
      ensureAuthed();
      const user = getJson(STORAGE_KEYS.user, null);
      if (!user) {
        const err = new Error('Authentication required');
        err.status = 401;
        throw err;
      }
      return user;
    },
    async loginViaEmailPassword(email) {
      const user = { email };
      window.localStorage.setItem(STORAGE_KEYS.token, 'local-token');
      setJson(STORAGE_KEYS.user, user);
      return user;
    },
    loginWithProvider(_provider, redirectPath = '/') {
      window.location.href = redirectPath;
    },
    async register({ email }) {
      window.localStorage.setItem(STORAGE_KEYS.pendingOtpEmail, email);
      return { ok: true };
    },
    async verifyOtp({ email, otpCode }) {
      const pendingEmail = window.localStorage.getItem(STORAGE_KEYS.pendingOtpEmail);
      if (!pendingEmail || pendingEmail !== email || otpCode !== '123456') {
        const err = new Error('Invalid verification code');
        err.status = 400;
        throw err;
      }
      return { access_token: 'local-token' };
    },
    setToken(token) {
      window.localStorage.setItem(STORAGE_KEYS.token, token);
      const pendingEmail = window.localStorage.getItem(STORAGE_KEYS.pendingOtpEmail);
      if (pendingEmail) {
        setJson(STORAGE_KEYS.user, { email: pendingEmail });
      }
      window.localStorage.removeItem(STORAGE_KEYS.pendingOtpEmail);
    },
    async resendOtp() {
      return { ok: true };
    },
    async resetPasswordRequest() {
      return { ok: true };
    },
    async resetPassword() {
      return { ok: true };
    },
    logout(redirectUrl) {
      window.localStorage.removeItem(STORAGE_KEYS.token);
      window.localStorage.removeItem(STORAGE_KEYS.user);
      if (redirectUrl) window.location.href = redirectUrl;
    },
    redirectToLogin(fromUrl = '/') {
      window.location.href = `/login?from=${encodeURIComponent(fromUrl)}`;
    },
  },
  entities: {
    AgentRequest: {
      async create(data) {
        const list = getJson(STORAGE_KEYS.agentRequests, []);
        const item = { id: crypto.randomUUID(), created_date: nowIso(), ...data };
        list.unshift(item);
        setJson(STORAGE_KEYS.agentRequests, list);
        return item;
      },
      async list(_sort = '-created_date', limit = 100) {
        const list = getJson(STORAGE_KEYS.agentRequests, []);
        return list.slice(0, limit);
      },
      async update(id, patch) {
        const list = getJson(STORAGE_KEYS.agentRequests, []);
        const idx = list.findIndex((x) => x.id === id);
        if (idx === -1) return null;
        list[idx] = { ...list[idx], ...patch };
        setJson(STORAGE_KEYS.agentRequests, list);
        return list[idx];
      },
    },
  },
  integrations: {
    Core: {
      async SendEmail() {
        return { ok: true };
      },
    },
  },
};


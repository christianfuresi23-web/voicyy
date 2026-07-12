export class AdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigurationError";
  }
}

function required(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new AdminConfigurationError(`${name} non configurata`);
  }
  return value;
}

export function adminSessionSecret() {
  const value = required("ADMIN_SESSION_SECRET");
  if (new TextEncoder().encode(value).byteLength < 32) {
    throw new AdminConfigurationError(
      "ADMIN_SESSION_SECRET deve contenere almeno 32 byte casuali",
    );
  }
  return value;
}

function bcryptHash(name: string) {
  const value = required(name);
  if (!/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value)) {
    throw new AdminConfigurationError(`${name} non contiene un hash bcrypt valido`);
  }
  return value;
}

export function adminPasswordHash() {
  return bcryptHash("ADMIN_PASSWORD_HASH");
}

export function adminRecoveryPhraseHash() {
  return bcryptHash("ADMIN_RECOVERY_PHRASE_HASH");
}

export function adminEncryptionKey() {
  const encoded = required("ADMIN_ENCRYPTION_KEY");
  let key: Buffer;

  if (/^[a-f\d]{64}$/i.test(encoded)) {
    key = Buffer.from(encoded, "hex");
  } else {
    key = Buffer.from(encoded, "base64url");
  }

  if (key.byteLength !== 32) {
    throw new AdminConfigurationError(
      "ADMIN_ENCRYPTION_KEY deve essere una chiave casuale da 32 byte (base64url o 64 caratteri hex)",
    );
  }

  return key;
}

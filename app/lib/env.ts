import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requiredInProduction(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(
      `Missing environment variable: ${name} (required in production)`,
    );
  }
  return value ?? "";
}

export const env = {
  get DATABASE_URL() {
    return required("DATABASE_URL");
  },
  get APP_URL() {
    return requiredInProduction("APP_URL") || "http://localhost:3000";
  },
  get SMTP_HOST() {
    return (
      requiredInProduction("SMTP_HOST") ||
      "postfix-relay.postfix.svc.cluster.local"
    );
  },
  get SMTP_PORT() {
    return parseInt(requiredInProduction("SMTP_PORT") || "587");
  },
  get SMTP_FROM() {
    return (
      requiredInProduction("SMTP_FROM") || "Pyramid <pyramid@raphi011.dev>"
    );
  },
  get NODE_ENV() {
    return process.env.NODE_ENV ?? "development";
  },
};

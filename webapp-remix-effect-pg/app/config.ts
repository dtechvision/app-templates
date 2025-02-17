import { PgClient } from "@effect/sql-pg";
import { Config, Effect, Layer, Option } from "effect";

// Define all environment variables in one place
export const envConfig = Config.all({
  NODE_ENV: Config.nonEmptyString("NODE_ENV").pipe(
    Config.withDefault("development"),
  ),

  // Database Configuration
  DATABASE_URL: Config.option(Config.redacted("DATABASE_URL")).pipe(
    Config.map(Option.getOrUndefined),
  ),
  DATABASE_NAME: Config.nonEmptyString("DATABASE_NAME").pipe(
    Config.withDefault("effect_pg_dev"),
  ),
  DATABASE_USER: Config.nonEmptyString("DATABASE_USER").pipe(
    Config.withDefault("postgres"),
  ),
  DATABASE_PASS: Config.redacted("DATABASE_PASS"),
  DATABASE_HOST: Config.nonEmptyString("DATABASE_HOST").pipe(
    Config.withDefault("localhost"),
  ),
  DATABASE_PORT: Config.number("DATABASE_PORT").pipe(Config.withDefault(5432)),
  // default to false for dev environments locally
  DATABASE_SSL: Config.string("DATABASE_SSL").pipe(
    Config.map((str) => str === "true"),
    Config.withDefault(false),
  ),

  // Telemetry Configuration
  SERVICE_NAME: Config.nonEmptyString("SERVICE_NAME").pipe(
    Config.withDefault("remix-effect-demo"),
  ),
  OTEL_EXPORTER_OTLP_ENDPOINT: Config.nonEmptyString(
    "OTEL_EXPORTER_OTLP_ENDPOINT",
  ).pipe(Config.withDefault("http://localhost:4318/v1/traces")),
  METRICS_PORT: Config.number("METRICS_PORT").pipe(Config.withDefault(9464)),
  OTEL_EXPORTER_OTLP_HEADERS: Config.string("OTEL_EXPORTER_OTLP_HEADERS").pipe(
    Config.withDefault(""),
  ),

  // Farcaster Configuration
  HUB_URL: Config.string("HUB_URL"),
  HUB_API_KEY: Config.string("HUB_API_KEY"),
});

// Database Layer
export const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const config = yield* envConfig;

    if (config.DATABASE_URL) {
      yield* Effect.logInfo("[SqlLive] using DATABASE_URL");
      return PgClient.layer({
        url: config.DATABASE_URL,
        ssl: config.DATABASE_SSL,
      });
    }

    yield* Effect.logInfo("[SqlLive] using individual env variables");
    return PgClient.layer({
      database: config.DATABASE_NAME,
      username: config.DATABASE_USER,
      password: config.DATABASE_PASS,
      host: config.DATABASE_HOST,
      port: config.DATABASE_PORT,
      ssl: config.DATABASE_SSL,
    });
  }),
);

import { PgClient } from "@effect/sql-pg";
import { Config, Effect, Layer, Option } from "effect";

export const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const url = yield* Config.option(Config.redacted("DATABASE_URL")).pipe(
      Effect.flatMap(Option.match({
        // if DATABASE_URL is set, use it
        onSome: (url) => Effect.gen(function* () {
          yield* Effect.logInfo("[SqlLive] using DATABASE_URL");
          return PgClient.layer({ url });
        }),
        // if DATABASE_URL is not set, use individual env variables
        onNone: () => Effect.gen(function* () {
          yield* Effect.logInfo("[SqlLive] no DATABASE_URL, using individual env variables");
          const database = yield* Config.nonEmptyString("DATABASE_NAME").pipe(
            Config.withDefault("effect_pg_dev"),
          );
          const username = yield* Config.nonEmptyString("DATABASE_USER").pipe(
            Config.withDefault("postgres"),
          );
          const password = yield* Config.redacted("DATABASE_PASS");
          const host = yield* Config.nonEmptyString("DATABASE_HOST").pipe(
            Config.withDefault("localhost"),
          );
          const port = yield* Config.number("DATABASE_PORT").pipe(
            Config.withDefault(5432),
          );
          return PgClient.layer({
            database,
            username,
            password,
            host,
            port
          });
        }),
      }))
    );

    return url;
  }),
);

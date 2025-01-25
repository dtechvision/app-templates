import { PgClient } from "@effect/sql-pg";
import { Layer, Effect, Config } from "effect";

export const SqlLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const database = yield* Config.nonEmptyString("DATABASE_NAME").pipe(
      Config.withDefault("effect_pg_dev")
    );
    const username = yield* Config.nonEmptyString("DATABASE_USER").pipe(
      Config.withDefault("postgres")
    );
    const host = yield* Config.nonEmptyString("DATABASE_HOST").pipe(
      Config.withDefault("localhost")
    );
    const port = yield* Config.number("DATABASE_PORT").pipe(
      Config.withDefault(5432)
    );

    return PgClient.layer({
      database,
      username,
      host,
      port,
    });
  })
);
import { fileURLToPath } from "node:url";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { PgMigrator } from "@effect/sql-pg";
import { Effect, Layer, pipe } from "effect";
import { SqlLive } from "~/config";

const program = Effect.gen(function* () {
  // ...
});

const MigratorLive = PgMigrator.layer({
  loader: PgMigrator.fromFileSystem(
    fileURLToPath(new URL("../app/migrations", import.meta.url)),
  ),
  // Where to put the `_schema.sql` file
  schemaDirectory: "./app/migrations",
}).pipe(Layer.provide(SqlLive));

const EnvLive = Layer.mergeAll(SqlLive, MigratorLive).pipe(
  Layer.provide(NodeContext.layer),
);

pipe(program, Effect.provide(EnvLive), NodeRuntime.runMain);

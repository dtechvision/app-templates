import { Layer } from "effect";
import { SqlLive } from "~/config";
import { makeRemixRuntime } from "~/lib/utilities";
import { TelemetryLive } from "./Telemetry";
import { TodoRepo } from "./TodoRepo";

const AppLive = Layer.provide(
  Layer.merge(TodoRepo.Live, TelemetryLive),
  SqlLive,
);

export const { loaderFunction } = makeRemixRuntime(AppLive);

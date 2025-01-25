import { Layer } from "effect";
import { makeRemixRuntime } from "~/lib/utilities";
import { TelemetryLive } from "./Telemetry";
import { TodoRepo } from "./TodoRepo";
import { SqlLive } from "~/config";

const AppLive = Layer.provide(
  Layer.merge(TodoRepo.Live, TelemetryLive),
  SqlLive,
);

export const { loaderFunction } = makeRemixRuntime(AppLive);

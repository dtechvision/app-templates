import { Layer } from "effect";
import { SqlLive } from "~/config";
import { makeRemixRuntime } from "~/lib/utilities";
import { FrameNotificationRepo } from "./FrameNotificationRepo";
import { TelemetryLive } from "./Telemetry";
import { TodoRepo } from "./TodoRepo";

const AppLive = Layer.provide(
  Layer.merge(
    Layer.merge(TodoRepo.Live, FrameNotificationRepo.Live),
    TelemetryLive,
  ),
  SqlLive,
);

export const { loaderFunction } = makeRemixRuntime(AppLive);

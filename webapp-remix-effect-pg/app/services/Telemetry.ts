import { DevTools } from "@effect/experimental";
import { NodeSdk } from "@effect/opentelemetry";
import { NodeSocket } from "@effect/platform-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { Config, Effect, Layer, LogLevel, Logger } from "effect";

export const TracingLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const serviceName = yield* Config.nonEmptyString("SERVICE_NAME").pipe(
      Config.withDefault("remix-effect-demo"),
    );
    const otelEndpoint = yield* Config.nonEmptyString(
      "OTEL_EXPORTER_OTLP_ENDPOINT",
    ).pipe(Config.withDefault("http://localhost:4318/v1/traces"));
    const metricsPort = yield* Config.number("METRICS_PORT").pipe(
      Config.withDefault(9464),
    );

    // Parse OTEL headers from environment variable
    const headers = yield* Config.string("OTEL_EXPORTER_OTLP_HEADERS").pipe(
      Config.withDefault(""),
      Effect.map((headerString) => {
        if (!headerString) return {};
        return headerString.split(",").reduce(
          (acc, pair) => {
            const [key, value] = pair.split("=");
            if (key && value) {
              acc[key.trim()] = value.trim();
            }
            return acc;
          },
          {} as Record<string, string>,
        );
      }),
    );

    return NodeSdk.layer(() => ({
      resource: { serviceName },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: otelEndpoint,
          headers,
        }),
      ),
      metricReader: new PrometheusExporter({
        port: metricsPort,
      }),
    }));
  }),
);

// Configure logging level based on environment
const LoggingLive = Layer.unwrapEffect(
  Effect.gen(function* () {
    const NODE_ENV = yield* Config.nonEmptyString("NODE_ENV");

    return Logger.minimumLogLevel(
      NODE_ENV === "production" ? LogLevel.Info : LogLevel.Debug,
    );
  }),
);

// const DevToolsLive = DevTools.layerWebSocket().pipe(
//   Layer.provide(NodeSocket.layerWebSocketConstructor),
// );

// Combine all telemetry layers
export const TelemetryLive = Layer.mergeAll(
  // DevToolsLive, // NOTICE: when enabling dev tools you'll only see traces in the IDE DevTools, not your OTEL endpoint!!!
  TracingLive,
  LoggingLive,
);

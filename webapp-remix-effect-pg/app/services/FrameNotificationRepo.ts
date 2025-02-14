import type { ParseError } from "@effect/schema/ParseResult";
import { SqlClient, type SqlError } from "@effect/sql";
import { Effect, Layer, Metric } from "effect";
import type { FrameNotification } from "~/types/FrameNotifications";

interface FrameNotificationRepoService {
  getNotificationDetails: (
    fid: number,
  ) => Effect.Effect<
    FrameNotification.Encoded | null,
    SqlError.SqlError | ParseError,
    never
  >;
  setNotificationDetails: (
    fid: number,
    token: string,
    url: string,
  ) => Effect.Effect<
    FrameNotification.Encoded,
    SqlError.SqlError | ParseError,
    never
  >;
  deleteNotificationDetails: (
    fid: number,
  ) => Effect.Effect<void, SqlError.SqlError, never>;
}

const notificationCounter = Metric.counter("frame_notifications_total", {
  description: "Total number of frame notifications in the system",
});

const makeFrameNotifications = Effect.gen(function* (_) {
  const sql = yield* SqlClient.SqlClient;

  const getNotificationDetails = (fid: number) =>
    Effect.gen(function* () {
      const result = yield* sql<{
        fid: number;
        token: string;
        url: string;
        created_at: Date;
      }>`
        SELECT * FROM frame_notifications 
        WHERE fid = ${fid}
        LIMIT 1
      `.pipe(
        Effect.withSpan("getNotificationDetails.query"),
        Effect.tap(() => Effect.annotateCurrentSpan("fid", fid.toString())),
        Effect.tapError((e) =>
          Effect.logError("Failed to fetch notification details", e),
        ),
      );

      if (result.length === 0) {
        return null;
      }

      const notification = result[0];
      return {
        fid: notification.fid,
        token: notification.token,
        url: notification.url,
        createdAt: notification.created_at.toISOString(),
      } as const;
    }).pipe(Effect.withSpan("FrameNotifications.getNotificationDetails"));

  const setNotificationDetails = (fid: number, token: string, url: string) =>
    Effect.gen(function* () {
      const result = yield* sql<{
        fid: number;
        token: string;
        url: string;
        created_at: Date;
      }>`
        INSERT INTO frame_notifications (fid, token, url)
        VALUES (${fid}, ${token}, ${url})
        ON CONFLICT (fid) DO UPDATE
        SET token = EXCLUDED.token,
            url = EXCLUDED.url
        RETURNING *
      `.pipe(
        Effect.withSpan("setNotificationDetails.query"),
        Effect.tap(() => Effect.annotateCurrentSpan("fid", fid.toString())),
        Effect.tapError((e) =>
          Effect.logError("Failed to set notification details", e),
        ),
      );

      yield* notificationCounter(Effect.succeed(1));

      return {
        fid: result[0].fid,
        token: result[0].token,
        url: result[0].url,
        createdAt: result[0].created_at.toISOString(),
      } as const;
    }).pipe(Effect.withSpan("FrameNotifications.setNotificationDetails"));

  const deleteNotificationDetails = (fid: number) =>
    Effect.gen(function* () {
      yield* sql`
        DELETE FROM frame_notifications 
        WHERE fid = ${fid}
      `.pipe(
        Effect.withSpan("deleteNotificationDetails.query"),
        Effect.tap(() => Effect.annotateCurrentSpan("fid", fid.toString())),
        Effect.tapError((e) =>
          Effect.logError("Failed to delete notification details", e),
        ),
      );

      yield* notificationCounter(Effect.succeed(-1));
    }).pipe(Effect.withSpan("FrameNotifications.deleteNotificationDetails"));

  return {
    getNotificationDetails,
    setNotificationDetails,
    deleteNotificationDetails,
  } satisfies FrameNotificationRepoService;
});

export class FrameNotificationRepo extends Effect.Tag(
  "@services/FrameNotificationRepo",
)<FrameNotificationRepo, FrameNotificationRepoService>() {
  static Live = Layer.effect(this, makeFrameNotifications);
}

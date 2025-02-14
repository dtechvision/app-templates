import {
  type ParseWebhookEvent,
  createVerifyAppKeyWithHub,
  parseWebhookEvent,
} from "@farcaster/frame-node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Config, Effect } from "effect";
import { FrameNotificationRepo } from "~/services/FrameNotificationRepo";
import { loaderFunction } from "~/services/index";

// GET request handler called when we send a notification, we get a callback here
export const loader = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  return Response.json({ success: true });
};

// POST request handler called when the user changes frame notification settings
export const action = async ({ request }: ActionFunctionArgs) =>
  Effect.gen(function* (_) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const body = yield* Effect.promise(() => request.json());
    const hubUrl = yield* Config.string("HUB_URL");
    const hubApiKey = yield* Config.string("HUB_API_KEY");

    // Verify and parse the webhook event
    const verifier = createVerifyAppKeyWithHub(hubUrl, {
      headers: {
        "x-api-key": hubApiKey,
      },
    });

    try {
      const data = yield* Effect.promise(() =>
        parseWebhookEvent(body, verifier),
      );
      const fid = data.fid;
      const event = data.event;

      switch (event.event) {
        case "frame_added":
        case "notifications_enabled":
          if (event.notificationDetails) {
            yield* FrameNotificationRepo.setNotificationDetails(
              fid,
              event.notificationDetails.token,
              event.notificationDetails.url,
            );
          }
          break;

        case "frame_removed":
        case "notifications_disabled":
          yield* FrameNotificationRepo.deleteNotificationDetails(fid);
          break;
      }

      return Response.json({ success: true });
    } catch (e) {
      const error = e as ParseWebhookEvent.ErrorType;

      switch (error.name) {
        case "VerifyJsonFarcasterSignature.InvalidDataError":
        case "VerifyJsonFarcasterSignature.InvalidEventDataError":
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 400 },
          );
        case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 401 },
          );
        case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500 },
          );
        default:
          return new Response(
            JSON.stringify({ success: false, error: "Unknown error" }),
            { status: 500 },
          );
      }
    }
  });

import { Schema } from "effect";

export class FrameNotification extends Schema.Class<FrameNotification>(
  "FrameNotification",
)({
  fid: Schema.Number,
  token: Schema.String,
  url: Schema.String,
  createdAt: Schema.DateFromString,
}) {
  static encode = Schema.encode(this);
}

export namespace FrameNotification {
  export type Encoded = Schema.Schema.Encoded<typeof FrameNotification>;
}

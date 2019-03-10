import * as iots from "io-ts";
import { artist } from "./Artist";

export const track = iots.type({
  id: iots.string,
  name: iots.string,
  type: iots.literal("track"),
  uri: iots.string,
  artists: iots.array(artist)
});

export interface Track extends iots.TypeOf<typeof track> {}

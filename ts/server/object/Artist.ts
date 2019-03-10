import * as iots from "io-ts";

export const artist = iots.type({
  name: iots.string,
  id: iots.string
});
export interface Artist extends iots.TypeOf<typeof artist> {}

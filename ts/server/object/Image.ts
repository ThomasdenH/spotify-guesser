import * as iots from "io-ts";

export const image = iots.type({
  height: iots.Integer,
  url: iots.string,
  width: iots.Integer
});
export interface Image extends iots.TypeOf<typeof image> {}

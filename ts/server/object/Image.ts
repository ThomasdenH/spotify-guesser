import * as iots from "io-ts";

export const image = iots.intersection([
  iots.type({
    url: iots.string
  }),
  iots.partial({
    height: iots.union([iots.Integer, iots.null]),
    width: iots.union([iots.Integer, iots.null])
  })
]);
export interface Image extends iots.TypeOf<typeof image> {}

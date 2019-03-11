import * as iots from "io-ts";

export function pagingObject<T>(
  type: iots.Type<T>
): iots.TypeC<{ href: iots.StringC; items: iots.ArrayC<iots.Type<T>> }> {
  return iots.type({
    href: iots.string,
    items: iots.array(type)
  });
}

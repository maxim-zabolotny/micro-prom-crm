import { useState } from "react";
import { FullProduct } from "./FullProduct/FullProduct";
import { ShortProduct } from "./ShortProduct/ShortProduct";

export function Product({ data }) {
  const [globalView, setGlobalView] = useState(false);

  return globalView ? (
    <FullProduct product={data} changeView={() => setGlobalView(false)} />
  ) : (
    <ShortProduct product={data} changeView={() => setGlobalView(true)} />
  );
}

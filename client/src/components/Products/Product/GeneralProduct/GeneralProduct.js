import React, { useState } from "react";
import { ShortProduct } from "../ShortProduct/ShortProduct";
import { FullProduct } from "../FullProduct/FullProduct";

export function GeneralProduct({ product }) {
  const [globalView, setGlobalView] = useState(false);

  const shortProductInfo = (
    <ShortProduct product={product} changeView={() => setGlobalView(true)} />
  );

  const fullProductInfo = (
    <FullProduct
      product={product}
      changeView={() => setGlobalView(false)}
      changeViewAble={true}
    />
  );

  return globalView ? fullProductInfo : shortProductInfo;
}

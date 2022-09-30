import React, { useState } from "react";
import { ShortProduct } from "../ShortProduct/ShortProduct";
import { FullProduct } from "../FullProduct/FullProduct";

export function GeneralProduct({ ...props }) {
  const [product, setProduct] = useState(props.product);
  const [globalView, setGlobalView] = useState(false);

  const shortProductInfo = (
    <ShortProduct product={product} changeView={() => setGlobalView(true)} />
  );

  const fullProductInfo = (
    <FullProduct
      changeViewAble={true}
      changeView={() => setGlobalView(false)}
      product={product}
      setProduct={setProduct}
    />
  );

  return globalView ? fullProductInfo : shortProductInfo;
}

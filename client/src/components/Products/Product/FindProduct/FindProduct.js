import React, { useEffect, useState } from "react";
import { useAxios } from "../../../../hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { FullProduct } from "../FullProduct/FullProduct";
import { FindProductForm } from "../FindProductForm/FindProductForm";
import { getRawPathname } from "../../../../utils/navigation/getRawPathname";

export function FindProduct({ url, productId }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const { data, loading, fetch } = useAxios(
    url,
    {
      method: "get",
      params: {
        id: productId,
      },
    },
    Boolean(productId)
  );

  useEffect(() => {
    setProduct(data);

    if (data) {
      navigate(`${getRawPathname(location.pathname)}${data._id}`);
    }
  }, [data]);

  if (loading) {
    return <p>LOADING..</p>;
  }

  const formInfo = (
    <FindProductForm product={product} fetch={(id) => fetch({}, { id })} />
  );

  const productInfo = product ? (
    <FullProduct
      changeViewAble={false}
      product={product}
      setProduct={setProduct}
    />
  ) : null;

  return (
    <div>
      {formInfo}
      {productInfo}
    </div>
  );
}

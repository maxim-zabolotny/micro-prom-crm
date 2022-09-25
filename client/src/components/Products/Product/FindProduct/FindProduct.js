import React, { useEffect, useState } from "react";
import { useAxios } from "../../../../hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../../../api/baseURL";
import { FullProduct } from "../FullProduct/FullProduct";
import { FindProductForm } from "../FindProductForm/FindProductForm";
import { getRawPathname } from "../../../../utils/navigation/getRawPathname";

export function FindProduct({ productId }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const { data, loading, fetch } = useAxios(
    API_URL.PRODUCTS.BASE,
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

  useEffect(() => {
    return () => {
      navigate(getRawPathname(location.pathname));
    };
  }, []);

  if (loading) {
    return <p>LOADING..</p>;
  }

  const formInfo = (
    <FindProductForm product={product} fetch={(id) => fetch({}, { id })} />
  );

  const productInfo = product ? (
    <FullProduct product={product} changeViewAble={false} />
  ) : null;

  return (
    <div>
      {formInfo}
      {productInfo}
    </div>
  );
}

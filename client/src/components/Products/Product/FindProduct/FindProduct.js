import React, { useEffect, useState } from "react";
import { useAxios, useRequestAccess } from "../../../../hooks";
import { useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../../../../api/baseURL";
import { FullProduct } from "../FullProduct/FullProduct";
import { FindProductForm } from "../FindProductForm/FindProductForm";
import { getRawPathname } from "../../../../utils/navigation/getRawPathname";

const REQUEST_URL = API_URL.PRODUCTS.BASE;

export function FindProduct({ productId }) {
  const [userHaveAccess, errorAccessMessage] = useRequestAccess(REQUEST_URL);

  const location = useLocation();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const { data, loading, fetch } = useAxios(
    REQUEST_URL,
    {
      method: "get",
      params: {
        id: productId,
      },
    },
    Boolean(productId) && userHaveAccess
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
    <FullProduct product={product} changeViewAble={false} />
  ) : null;

  return userHaveAccess ? (
    <div>
      {formInfo}
      {productInfo}
    </div>
  ) : (
    errorAccessMessage
  );
}

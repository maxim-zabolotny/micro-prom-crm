import { FindProduct, Products } from "../../components/Products";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Button } from "antd";
import { getRawPathname } from "../../utils/navigation/getRawPathname";
import { RequestAccess } from "../../components/RequestAccess";
import { API_URL } from "../../api/baseURL";
import "./products.css";

export function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const loaderData = useLoaderData();

  const [viewType, setViewType] = useState(
    loaderData.id ? "single" : "multiple"
  );

  const changeView = (viewType) => {
    return () => {
      setViewType(viewType);

      if (viewType === "multiple") {
        navigate(getRawPathname(location.pathname) + location.search);
      }
    };
  };

  let children;
  switch (viewType) {
    case "single": {
      children = (
        <RequestAccess url={API_URL.PRODUCTS.BASE} showMessage={true}>
          <FindProduct productId={loaderData.id} />
        </RequestAccess>
      );
      break;
    }
    case "multiple": {
      children = (
        <RequestAccess url={API_URL.PRODUCTS.SEARCH} showMessage={true}>
          <Products />
        </RequestAccess>
      );
      break;
    }
    default: {
      throw new Error("Непредвиденная ошибка");
    }
  }

  const buttons = (
    <div className={"products-page-buttons"}>
      <Button
        type={viewType === "single" ? "primary" : "default"}
        onClick={changeView("single")}
      >
        Продукт
      </Button>

      <Button
        type={viewType === "multiple" ? "primary" : "default"}
        onClick={changeView("multiple")}
      >
        Поиск
      </Button>
    </div>
  );

  return (
    <div className={"products-page-container"}>
      {buttons}
      {children}
    </div>
  );
}

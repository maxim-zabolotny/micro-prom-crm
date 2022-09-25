import { FindProduct, Products } from "../../components/Products";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Button } from "antd";
import { getRawPathname } from "../../utils/navigation/getRawPathname";

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
        navigate(getRawPathname(location.pathname));
      }
    };
  };

  let children;
  switch (viewType) {
    case "single": {
      children = <FindProduct productId={loaderData.id} />;
      break;
    }
    case "multiple": {
      children = <Products />;
      break;
    }
    default: {
      throw new Error("Непредвиденная ошибка");
    }
  }

  const buttons = (
    <div style={{ margin: "10px" }}>
      <Button
        style={{ marginRight: "10px" }}
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
    <div>
      {buttons}
      {children}
    </div>
  );
}

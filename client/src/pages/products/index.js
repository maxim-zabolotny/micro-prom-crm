import { FindProduct, Products } from "../../components/Products";
import { useLoaderData } from "react-router-dom";
import React, { useState } from "react";
import { Button } from "antd";

export function ProductsPage() {
  const loaderData = useLoaderData();

  const [viewType, setViewType] = useState(
    loaderData.id ? "single" : "multiple"
  );

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
        onClick={() => setViewType("single")}
      >
        Продукт
      </Button>

      <Button
        type={viewType === "multiple" ? "primary" : "default"}
        onClick={() => setViewType("multiple")}
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

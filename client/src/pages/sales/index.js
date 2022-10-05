import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Button } from "antd";
import { RequestAccess } from "../../components/RequestAccess";
import { API_URL } from "../../api/baseURL";
import { FindSale, Sales } from "../../components/Sales";
import "./sales.css";

export function SalesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const loaderData = useLoaderData();

  const [viewType, setViewType] = useState(
    loaderData.id ? "single" : "multiple"
  );
  const [saleId, setSaleId] = useState(loaderData.id);

  const changeView = (viewType) => {
    return () => {
      setViewType(viewType);

      if (viewType === "multiple") {
        navigate(`/sale${location.search}`);
        setSaleId(null);
      }
    };
  };

  let children;
  switch (viewType) {
    case "single": {
      children = (
        <RequestAccess url={API_URL.PRODUCT_SALES.BASE} showMessage={true}>
          <FindSale saleId={saleId} />
        </RequestAccess>
      );
      break;
    }
    case "multiple": {
      children = (
        <RequestAccess url={API_URL.PRODUCT_SALES.SEARCH} showMessage={true}>
          <Sales
            changeView={(saleId) => {
              setViewType("single");
              setSaleId(saleId);
            }}
          />
        </RequestAccess>
      );
      break;
    }
    default: {
      throw new Error("Непредвиденная ошибка");
    }
  }

  const buttons = (
    <div className={"sales-page-buttons"}>
      <Button
        type={viewType === "single" ? "primary" : "default"}
        onClick={changeView("single")}
      >
        Продажи
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
    <div className={"sales-page-container"}>
      {buttons}
      {children}
    </div>
  );
}

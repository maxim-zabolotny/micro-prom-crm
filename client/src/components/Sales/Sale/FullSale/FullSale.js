import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../../../contexts/global";
import { UserRole } from "../../../CurrentUser";
import { SaleStatus } from "../../utils";
import { Button, Form, Select } from "antd";
import { RequestAccess } from "../../../RequestAccess";
import { API_URL } from "../../../../api/baseURL";
import { SetSaleDescriptionForm } from "../Forms/SetSaleDescriptionForm/SetSaleDescriptionForm";
import { SetSaleOrderForm } from "../Forms/SetSaleOrderForm/SetSaleOrderForm";
import { SetSaleClientForm } from "../Forms/SetSaleClientForm/SetSaleClientForm";
import { DeliverySaleForm } from "../Forms/DeliverySaleForm/DeliverySaleForm";
import { SaleForm } from "../Forms/SaleForm/SaleForm";
import { CancelSaleForm } from "../Forms/CancelSaleForm/CancelSaleForm";
import { SetSalePaidForm } from "../Forms/SetSalePaidForm/SetSalePaidForm";
import "./FullSale.css";
import { useNavigate } from "react-router-dom";
import { dateToStr } from "../../../../utils/date";

export function FullSale({ sale, setSale }) {
  const { currentUser } = useContext(GlobalContext);
  const navigate = useNavigate();
  const [saleStatus, setSaleStatus] = useState(sale.status);

  const { product } = sale;

  useEffect(() => {
    if (saleStatus !== sale.status) {
      setSaleStatus(sale.status);
    }
  }, [sale.status]);

  const isCurrentUserProvider = [UserRole.Admin, UserRole.Provider].includes(
    currentUser.role
  );
  const isCurrentUserSales = [UserRole.Admin, UserRole.Sales].includes(
    currentUser.role
  );

  const isChangeable =
    sale.status !== SaleStatus.Canceled && isCurrentUserSales;

  const changeSale = (sale) => {
    setSale(sale);
    setSaleStatus(sale.status);
  };

  const getDisableStatus = (status) => {
    const defaultStatuses = [sale.status, SaleStatus.Canceled];

    switch (sale.status) {
      case SaleStatus.WaitDeliver: {
        return [SaleStatus.Delivering, ...defaultStatuses].includes(status)
          ? false
          : true;
      }
      case SaleStatus.Delivering: {
        return [SaleStatus.Sale, ...defaultStatuses].includes(status)
          ? false
          : true;
      }
      case SaleStatus.Sale: {
        return [SaleStatus.Canceled, ...defaultStatuses].includes(status)
          ? false
          : true;
      }
      case SaleStatus.Canceled: {
        return true;
      }
    }
  };

  let changeStatusForm;
  switch (saleStatus) {
    case SaleStatus.Delivering: {
      if (saleStatus === sale.status) break;

      changeStatusForm = (
        <RequestAccess url={API_URL.PRODUCT_SALES.DELIVERY}>
          <DeliverySaleForm sale={sale} changeSale={changeSale} />
        </RequestAccess>
      );
      break;
    }
    case SaleStatus.Sale: {
      if (saleStatus === sale.status) break;

      changeStatusForm = (
        <RequestAccess url={API_URL.PRODUCT_SALES.SALE}>
          <SaleForm sale={sale} changeSale={changeSale} />
        </RequestAccess>
      );
      break;
    }
    case SaleStatus.Canceled: {
      if (saleStatus === sale.status) break;

      changeStatusForm = (
        <RequestAccess url={API_URL.PRODUCT_SALES.CANCEL}>
          <CancelSaleForm sale={sale} changeSale={changeSale} />
        </RequestAccess>
      );
      break;
    }
    default: {
      changeStatusForm = null;
      break;
    }
  }

  const saleAt = sale.saleAt ? (
    <span>
      <b>Дата продажи:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale.saleAt)} </b>
    </span>
  ) : null;

  const saleCanceledReason = sale.canceledReason ? (
    <span>
      <b>Причина отказа:</b> {sale.canceledReason}
    </span>
  ) : null;
  const saleCanceledAt = sale.canceledAt ? (
    <span>
      <b>Дата отказа:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale.canceledAt)}</b>
    </span>
  ) : null;

  const salePaidAt = sale.paidAt ? (
    <span>
      <b>Дата оплаты:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale.paidAt)}</b>
    </span>
  ) : null;

  const benefitPrice = isCurrentUserProvider ? (
    <span>
      <b>Выгода:</b> <b style={{ color: "#1890ff" }}>{sale.benefitPrice} грн</b>
    </span>
  ) : null;

  const deliveryProviderHumanRead = sale?.delivery?.provider
    ? sale.delivery.provider === "ukrposhta"
      ? "Укр почта"
      : "Новая почта"
    : null;
  const deliveryProvider = deliveryProviderHumanRead ? (
    <span>
      <b>Провайдер:</b> {deliveryProviderHumanRead}
    </span>
  ) : null;

  const deliveryId = sale?.delivery?.declarationId ? (
    <span>
      <b>Номер декларации:</b>{" "}
      <b style={{ color: "#1890ff" }}>{sale?.delivery.declarationId}</b>
    </span>
  ) : null;

  const deliveredAt = sale?.delivery?.time ? (
    <span>
      <b>Дата отправки:</b>{" "}
      <b style={{ color: "#1890ff" }}>{dateToStr(sale?.delivery.time)}</b>
    </span>
  ) : null;

  return (
    <div className={"full-sale-container"}>
      <div className={"full-sale"}>
        <img className={"full-sale-image"} src={product.images[0]} />
        <div className={"full-sale-main-info"}>
          <div className={"full-sale-product-info"}>
            <p className={"full-sale-item-header"}>Продукт:</p>
            <span>
              <b>ID:</b> {product.id}
            </span>
            <span>
              <b>Название:</b> {product.name}
            </span>
            <span>
              <b>microtronId:</b> {product.microtronId}
            </span>
            <Button
              size={"default"}
              type={"default"}
              onClick={() => navigate(`/${product.id}`)}
            >
              Показать Продукт
            </Button>
          </div>
          <div className={"full-sale-main-info-split-line"} />
          <div className={"full-sale-info"}>
            <p className={"full-sale-item-header"}>Продажа:</p>
            <span>
              <b>ID:</b> {sale._id}
            </span>
            <span>
              <b>Колличевство:</b> {sale.count} шт
            </span>
            <span>
              <b>Сумма:</b> {sale.totalPrice} грн
            </span>
            {benefitPrice}
            {salePaidAt}
            <span>
              <b>Дата создания: </b>
              <b style={{ color: "#1890ff" }}>{dateToStr(sale.createdAt)}</b>
            </span>
            {saleAt}
            {saleCanceledReason}
            {saleCanceledAt}
            <Form.Item label={<b>Статус</b>} wrapperCol={{ span: 10 }}>
              <Select
                name={"status"}
                disabled={!isChangeable}
                value={saleStatus}
                onSelect={setSaleStatus}
              >
                <Select.Option
                  disabled={getDisableStatus(SaleStatus.WaitDeliver)}
                  value={SaleStatus.WaitDeliver}
                >
                  В ожидании отправки
                </Select.Option>
                <Select.Option
                  disabled={getDisableStatus(SaleStatus.Delivering)}
                  value={SaleStatus.Delivering}
                >
                  Отправлен
                </Select.Option>
                <Select.Option
                  disabled={getDisableStatus(SaleStatus.Sale)}
                  value={SaleStatus.Sale}
                >
                  Продан
                </Select.Option>
                <Select.Option
                  disabled={getDisableStatus(SaleStatus.Canceled)}
                  value={SaleStatus.Canceled}
                >
                  Отменен
                </Select.Option>
              </Select>
            </Form.Item>
          </div>
          <div className={"full-sale-main-info-split-line"} />
          <div className={"full-sale-delivery-info"}>
            <p className={"full-sale-item-header"}>Доставка:</p>
            {deliveryProvider}
            {deliveryId}
            {deliveredAt}
          </div>
          <div className={"full-sale-main-info-split-line"} />
          {isChangeable ? changeStatusForm : null}
        </div>
        <div className={"full-sale-set-forms"}>
          <RequestAccess
            url={API_URL.PRODUCT_SALES.SET_PAID}
            showWithoutModifyAccess={true}
          >
            <SetSalePaidForm sale={sale} changeSale={setSale} />
          </RequestAccess>
          <div className={"full-sale-main-info-split-line"} />
          <RequestAccess
            url={API_URL.PRODUCT_SALES.SET_DESCRIPTION}
            showWithoutModifyAccess={true}
          >
            <SetSaleDescriptionForm sale={sale} changeSale={setSale} />
          </RequestAccess>
          <div className={"full-sale-main-info-split-line"} />
          <RequestAccess
            url={API_URL.PRODUCT_SALES.SET_ORDER}
            showWithoutModifyAccess={true}
          >
            <SetSaleOrderForm sale={sale} changeSale={setSale} />
          </RequestAccess>
          <div className={"full-sale-main-info-split-line"} />
          <RequestAccess
            url={API_URL.PRODUCT_SALES.SET_CLIENT}
            showWithoutModifyAccess={true}
          >
            <SetSaleClientForm sale={sale} changeSale={setSale} />
          </RequestAccess>
        </div>
      </div>
    </div>
  );
}

import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../../../../contexts/global";
import { UserRole } from "../../../CurrentUser";
import { SaleStatus } from "../../utils";
import { SaleProduct } from "../SaleProduct/SaleProduct";
import { SaleDelivery } from "../SaleDelivery/SaleDelivery";
import { Form, Select } from "antd";
import { RequestAccess } from "../../../RequestAccess";
import { API_URL } from "../../../../api/baseURL";
import { SetSaleDescriptionForm } from "../Forms/SetSaleDescriptionForm/SetSaleDescriptionForm";
import { SetSaleOrderForm } from "../Forms/SetSaleOrderForm/SetSaleOrderForm";
import { SetSaleClientForm } from "../Forms/SetSaleClientForm/SetSaleClientForm";
import { DeliverySaleForm } from "../Forms/DeliverySaleForm/DeliverySaleForm";
import { SaleForm } from "../Forms/SaleForm/SaleForm";
import { CancelSaleForm } from "../Forms/CancelSaleForm/CancelSaleForm";

export function FullSale({ sale, setSale }) {
  const { currentUser } = useContext(GlobalContext);
  const [saleStatus, setSaleStatus] = useState(sale.status);

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

  const saleBenefitPrice = isCurrentUserProvider ? (
    <span>benefit price: {sale.benefitPrice}</span>
  ) : null;

  const saleAt = sale.saleAt ? <span>sale at: {sale.saleAt}</span> : null;

  const saleCanceledReason = sale.canceledReason ? (
    <span>canceled reason: {sale.canceledReason}</span>
  ) : null;

  const saleCanceledAt = sale.canceledAt ? (
    <span>canceled at: {sale.canceledAt}</span>
  ) : null;

  const saleInfo = (
    <div
      style={{
        width: "100%",
      }}
    >
      <p>Sale</p>
      <span>id: {sale._id}</span>
      <br />
      <Form.Item
        label={"status"}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 16 }}
      >
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
      <span>
        status: <b>{sale.status}</b>
      </span>
      <br />
      <span>count: {sale.count}</span>
      <br />
      <span>total price: {sale.totalPrice}</span>
      <br />
      <span>date: {sale.createdAt}</span>
      <br />
      <RequestAccess
        url={API_URL.PRODUCT_SALES.SET_DESCRIPTION}
        showWithoutModifyAccess={true}
      >
        <SetSaleDescriptionForm sale={sale} changeSale={setSale} />
      </RequestAccess>
      <RequestAccess
        url={API_URL.PRODUCT_SALES.SET_ORDER}
        showWithoutModifyAccess={true}
      >
        <SetSaleOrderForm sale={sale} changeSale={setSale} />
      </RequestAccess>
      <RequestAccess
        url={API_URL.PRODUCT_SALES.SET_CLIENT}
        showWithoutModifyAccess={true}
      >
        <SetSaleClientForm sale={sale} changeSale={setSale} />
      </RequestAccess>
      {isChangeable ? changeStatusForm : null}
      <div>
        <p>Change Booking info</p>
        {saleBenefitPrice}
        <br />
        {saleAt}
        <br />
        {saleCanceledReason}
        <br />
        {saleCanceledAt}
      </div>
    </div>
  );

  const productInfo = <SaleProduct product={sale.product} />;

  const deliveryInfo = sale.delivery ? (
    <SaleDelivery delivery={sale.delivery} />
  ) : null;

  return (
    <div
      style={{
        border: "2px solid black",
        margin: "10px 5px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {saleInfo}
      <hr />
      {deliveryInfo}
      <hr />
      {productInfo}
    </div>
  );
}

import { useAxios } from "../../../../../hooks";
import React, { useEffect, useState } from "react";
import { Button, Form, Input, Select } from "antd";
import { DeliveryProvider } from "../../../utils";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";
import { NotificationManager } from "react-notifications";

export function DeliverySaleForm({ url, sale, changeSale }) {
  const [deliveryProvider, setDeliveryProvider] = useState(
    DeliveryProvider.NovaPoshta
  );

  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productSaleId: sale._id,
      ...values,
      provider: deliveryProvider,
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      NotificationManager.success(`Успех`, "Продажа отправлена", 5000);
    }
  }, [data]);

  if (loading) {
    return <LoaderSpinner />;
  }

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "10px",
      }}
    >
      <Form
        name="delivery-sale"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        onFinish={onFinish}
      >
        <Form.Item
          label={"Почтовый провайдер"}
          labelCol={{ span: 2 }}
          wrapperCol={{ span: 10 }}
          rules={[
            {
              required: true,
              message: "Поле обязательное",
            },
          ]}
        >
          <Select
            name={"provider"}
            value={deliveryProvider}
            onSelect={setDeliveryProvider}
          >
            <Select.Option value={DeliveryProvider.NovaPoshta}>
              Новая почта
            </Select.Option>
            <Select.Option value={DeliveryProvider.UkrPoshta}>
              Укр почта
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Номер декларации"
          name="declarationId"
          rules={[
            {
              required: deliveryProvider === DeliveryProvider.NovaPoshta,
              message: "Поле обязательное",
            },
          ]}
        >
          <Input
            placeholder={"Введите номер декларации"}
            disabled={deliveryProvider === DeliveryProvider.UkrPoshta}
          />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            span: 12,
            offset: 2,
          }}
        >
          <Button type="primary" htmlType="submit">
            Поддтвердить
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

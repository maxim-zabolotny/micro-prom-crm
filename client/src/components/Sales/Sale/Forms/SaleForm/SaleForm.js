import { useAxios } from "../../../../../hooks";
import React, { useEffect } from "react";
import { Button, DatePicker, Form } from "antd";
import { NotificationManager } from "react-notifications";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";

export function SaleForm({ url, sale, changeSale }) {
  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productSaleId: sale._id,
      saleAt: values.saleAt.toDate(),
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      NotificationManager.success(`Успех`, "Успешная продажа", 5000);
    }
  }, [data]);

  if (loading) {
    return <LoaderSpinner />;
  }

  return (
    <Form
      name="sale-sale"
      labelCol={{ span: 5 }}
      wrapperCol={{ span: 10 }}
      onFinish={onFinish}
    >
      <Form.Item
        label="Дата продажи"
        name="saleAt"
        rules={[
          {
            required: true,
            message: "Поле обязательное",
          },
        ]}
      >
        <DatePicker />
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
  );
}

import { useAxios } from "../../../../../hooks";
import React, { useEffect } from "react";
import { Button, DatePicker, Form } from "antd";

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

      // TODO notify: delivery
    }
  }, [data]);

  if (loading) {
    return <p>LOADING..</p>;
  }

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "10px",
      }}
    >
      <Form
        name="sale-sale"
        labelCol={{ span: 2 }}
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
    </div>
  );
}

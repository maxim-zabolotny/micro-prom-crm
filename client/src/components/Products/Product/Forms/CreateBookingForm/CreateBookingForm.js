import { Button, Form, Input, InputNumber } from "antd";
import React, { useEffect } from "react";
import { useAxios } from "../../../../../hooks";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";
import { NotificationManager } from "react-notifications";

export function CreateBookingForm({ url, product, changeProduct }) {
  const { data, loading, fetch } = useAxios(url, {
    method: "post",
    data: {},
  });

  const onFinish = (values) => {
    fetch({
      ...values,
      productId: product._id,
    });
  };

  useEffect(() => {
    if (data) {
      changeProduct({
        ...product,
        quantity: product.quantity - data.count,
      });

      NotificationManager.success(`Успех`, "Создано бронирование", 5000);
    }
  }, [data]);

  if (loading) {
    return <LoaderSpinner />;
  }

  return (
    <Form
      name="create-product-booking"
      labelCol={{ span: 2 }}
      wrapperCol={{ span: 10 }}
      onFinish={onFinish}
      initialValues={{
        count: product.quantity > 0 ? 1 : 0,
      }}
    >
      <Form.Item label="Количество" name={"count"}>
        <InputNumber
          min={product.quantity > 0 ? 1 : 0}
          max={product.quantity}
        />
      </Form.Item>

      <Form.Item label="Комментарий" hasFeedback name={"description"}>
        <Input.TextArea allowClear showCount />
      </Form.Item>

      <Form.Item
        wrapperCol={{
          span: 12,
          offset: 2,
        }}
      >
        <Button
          type="primary"
          htmlType="submit"
          disabled={product.quantity === 0}
        >
          Создать бронирование
        </Button>
      </Form.Item>
    </Form>
  );
}

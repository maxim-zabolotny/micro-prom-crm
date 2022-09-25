import { Button, Form, Input, InputNumber } from "antd";
import React, { useEffect } from "react";
import { useAxios, useRequestAccess } from "../../../../hooks";
import { API_URL } from "../../../../api/baseURL";

const REQUEST_URL = API_URL.PRODUCT_BOOKINGS.CREATE;

export function CreateBookingForm({ product, changeProduct }) {
  const [userHaveAccess] = useRequestAccess(REQUEST_URL);

  const { data, loading, fetch } = useAxios(REQUEST_URL, {
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

      // todo notify
    }
  }, [data]);

  const form = (
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

      <Form.Item label="Описание" hasFeedback name={"description"}>
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

  return userHaveAccess ? (
    <div
      style={{
        margin: "20px",
        border: "2px solid black",
      }}
    >
      {loading ? <p>LOADING..</p> : form}
    </div>
  ) : null;
}

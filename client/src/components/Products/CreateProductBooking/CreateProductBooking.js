import { Button, Form, Input, InputNumber } from "antd";
import React, { useEffect } from "react";
import { useAxios } from "../../../hooks";
import { API_URL } from "../../../api/baseURL";

export function CreateProductBooking({ product, changeProduct }) {
  const { data, loading, fetch } = useAxios(API_URL.PRODUCT_BOOKINGS.CREATE, {
    method: "post",
    data: {},
  });

  const onFinish = (values) => {
    console.log("values => ", values);
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

      console.log("reqult => ", data);
      // todo: redirect
    }
  }, [data]);

  const form = (
    <Form
      name="create-product-booking"
      labelCol={{ span: 2 }}
      wrapperCol={{ span: 10 }}
      onFinish={onFinish}
    >
      <Form.Item label="Количество" name={"count"}>
        <InputNumber
          min={product.quantity > 0 ? 1 : 0}
          max={product.quantity}
          defaultValue={product.quantity > 0 ? 1 : 0}
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

  return (
    <div
      style={{
        margin: "20px",
        border: "2px solid black",
      }}
    >
      {loading ? <p>LOADING..</p> : form}
    </div>
  );
}

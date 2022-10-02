import { Button, Form, Input } from "antd";
import React, { useEffect } from "react";
import "./FindProductForm.css";

export function FindProductForm({ product, fetch }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (product) {
      form.setFieldsValue({ productId: product._id });
    }
  }, [product]);

  return (
    <Form
      name="get-product"
      form={form}
      onFinish={(values) => fetch(values.productId)}
    >
      <Form.Item
        name={"productId"}
        rules={[
          {
            required: true,
            message: "Поле обязательное",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Искать
        </Button>
      </Form.Item>
    </Form>
  );
}

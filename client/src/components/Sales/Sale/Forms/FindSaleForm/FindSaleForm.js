import { Button, Form, Input } from "antd";
import React, { useEffect } from "react";

export function FindSaleForm({ sale, fetch }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (sale) {
      form.setFieldsValue({ saleId: sale._id });
    }
  }, [sale]);

  return (
    <Form
      name="get-sale"
      form={form}
      onFinish={(values) => fetch(values.saleId)}
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Form.Item
        name={"saleId"}
        rules={[
          {
            required: true,
            message: "Поле обязательное",
          },
        ]}
      >
        <Input
          style={{
            width: "300px",
            marginRight: "10px",
          }}
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Искать
        </Button>
      </Form.Item>
    </Form>
  );
}

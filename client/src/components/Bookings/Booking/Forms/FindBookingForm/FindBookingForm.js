import { Button, Form, Input } from "antd";
import React, { useEffect } from "react";

export function FindBookingForm({ booking, fetch }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (booking) {
      form.setFieldsValue({ bookingId: booking._id });
    }
  }, [booking]);

  return (
    <Form
      name="get-booking"
      form={form}
      onFinish={(values) => fetch(values.bookingId)}
      style={{
        display: "flex",
        flexDirection: "row",
      }}
    >
      <Form.Item
        name={"bookingId"}
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

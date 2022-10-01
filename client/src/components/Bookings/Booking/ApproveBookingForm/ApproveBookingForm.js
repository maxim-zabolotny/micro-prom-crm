import { useAxios } from "../../../../hooks";
import React, { useEffect } from "react";
import { Button, Form, Input } from "antd";
import { strIsNumberRule } from "../../../../utils/formRules/strIsNumberRule";

export function ApproveBookingForm({ url, booking, changeBooking }) {
  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productBookingId: booking._id,
      rawPrice: parseFloat(values.rawPrice),
    });
  };

  useEffect(() => {
    if (data) {
      changeBooking(data.booking);

      // TODO notify: sale created
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
        name="approve-booking"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        onFinish={onFinish}
      >
        <Form.Item
          label="Цена"
          name="rawPrice"
          rules={[
            strIsNumberRule,
            {
              required: true,
              message: "Поле обязательное",
            },
          ]}
        >
          <Input placeholder={"Введите цену со склада"} />
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

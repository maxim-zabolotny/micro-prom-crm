import { useAxios } from "../../../../hooks";
import React, { useEffect } from "react";
import { Button, Form, Input } from "antd";

export function DisapproveBookingForm({ url, booking, changeBooking }) {
  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productBookingId: booking._id,
      disapproveReason: values.disapproveReason,
    });
  };

  useEffect(() => {
    if (data) {
      changeBooking(data);

      // TODO notify: disapproved
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
        name="disapprove-booking"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        onFinish={onFinish}
      >
        <Form.Item
          label="Причина"
          name="disapproveReason"
          rules={[
            {
              required: true,
              message: "Поле обязательное",
            },
          ]}
        >
          <Input placeholder={"Введите причину отказа"} />
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

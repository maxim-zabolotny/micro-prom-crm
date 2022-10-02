import { useAxios } from "../../../../../hooks";
import React, { useEffect } from "react";
import { Button, Form, Input } from "antd";

export function CancelSaleForm({ url, sale, changeSale }) {
  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productSaleId: sale._id,
      canceledReason: values.canceledReason,
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      // TODO notify: canceled
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
        name="cancel-sale"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        onFinish={onFinish}
      >
        <Form.Item
          label="Причина"
          name="canceledReason"
          rules={[
            {
              required: true,
              message: "Поле обязательное",
            },
          ]}
        >
          <Input.TextArea
            allowClear
            showCount
            placeholder={"Введите причину"}
          />
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

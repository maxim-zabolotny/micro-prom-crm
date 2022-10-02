import { useAxios } from "../../../../../hooks";
import React, { useEffect } from "react";
import { Button, Form, Input } from "antd";
import { NotificationManager } from "react-notifications";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";

export function SetSaleDescriptionForm({ url, haveAccess, sale, changeSale }) {
  const [form] = Form.useForm();

  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productSaleId: sale._id,
      description: values.description,
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      NotificationManager.success(`Успех`, "Описание сохранено", 5000);
    }
  }, [data]);

  useEffect(() => {
    form.setFieldsValue({ description: sale.description });
  }, [sale.description]);

  if (loading) {
    return <LoaderSpinner />;
  }

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "10px",
        width: "100%",
        margin: "10px",
      }}
    >
      <Form
        name="set-sale-description"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label="Описание"
          name="description"
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
            placeholder={"Введите дополнительное описание"}
          />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            span: 12,
            offset: 2,
          }}
        >
          <Button type="primary" htmlType="submit" disabled={!haveAccess}>
            Сохранить
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

import { useAxios } from "../../../../../hooks";
import React, { useEffect } from "react";
import { Button, Form, Input } from "antd";
import { strIsNumberRule } from "../../../../../utils/formRules/strIsNumberRule";
import { LoaderSpinner } from "../../../../LoaderSpinner/LoaderSpinner";
import { NotificationManager } from "react-notifications";

export function SetSaleOrderForm({ url, haveAccess, sale, changeSale }) {
  const [form] = Form.useForm();

  const { data, loading, fetch } = useAxios(url, {
    method: "put",
  });

  const onFinish = (values) => {
    fetch({
      productSaleId: sale._id,
      promOrderId: Number(values.promOrderId),
    });
  };

  useEffect(() => {
    if (data) {
      changeSale(data);

      NotificationManager.success(`Успех`, "Номер заказа сохранен", 5000);
    }
  }, [data]);

  useEffect(() => {
    form.setFieldsValue({ promOrderId: sale.promOrderId });
  }, [sale.promOrderId]);

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
        name="set-sale-order"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label="Номер заказа"
          name="promOrderId"
          rules={[
            {
              required: true,
              message: "Поле обязательное",
            },
            strIsNumberRule,
          ]}
        >
          <Input placeholder={"Введите номер заказа"} />
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

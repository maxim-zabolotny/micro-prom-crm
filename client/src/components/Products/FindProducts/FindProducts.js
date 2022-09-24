import { Button, Form, Input } from "antd";
import React from "react";
import "./FindProducts.css";

export function FindProducts({ data, fetch, productsSize }) {
  const onFinish = (values) => {
    const nextData = {
      offset: 0,
      limit: data.limit,
      ...values,
    };

    nextData.microtronId
      ? (nextData.microtronId = Number(nextData.microtronId))
      : (nextData.microtronId = null);

    nextData.promId
      ? (nextData.promId = Number(nextData.promId))
      : (nextData.promId = null);

    fetch(nextData);
  };

  const fetchNextProducts = () => {
    const nextData = { ...data };
    nextData.offset += nextData.limit;

    fetch(nextData);
  };

  const fetchPreviousProducts = () => {
    const nextData = { ...data };
    nextData.offset -= nextData.limit;

    fetch(nextData);
  };

  const strToNumberRule = {
    message: "Должно быть числом",
    type: "number",
    transform: (v) => {
      const result = Number(v);
      return Number.isNaN(result) ? v : result;
    },
  };

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "10px",
      }}
    >
      <Form
        name="find-products"
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
        onFinish={onFinish}
      >
        <Form.Item label="Имя товара" name="name">
          <Input placeholder={"Введите имя товара"} />
        </Form.Item>

        <Form.Item
          label="Microtron ID"
          name="microtronId"
          rules={[strToNumberRule]}
        >
          <Input placeholder={"Введите Microtron ID"} />
        </Form.Item>

        <Form.Item label="Prom ID" name="promId" rules={[strToNumberRule]}>
          <Input placeholder={"Введите Prom ID"} />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            span: 12,
            offset: 2,
          }}
        >
          <Button type="primary" htmlType="submit">
            Искать
          </Button>

          <Button
            htmlType="button"
            disabled={productsSize < data.limit}
            onClick={fetchNextProducts}
          >
            Следующие товары
          </Button>

          <Button
            htmlType="button"
            disabled={data.offset === 0}
            onClick={fetchPreviousProducts}
          >
            Предыдущие товары
          </Button>
        </Form.Item>

        <Form.Item label="Результат">
          <span className="ant-form-text">
            Показаные товары: {data.offset} - {data.offset + productsSize}
          </span>
          <br />
          <span className="ant-form-text">Найдено товаров: {productsSize}</span>
        </Form.Item>
      </Form>
    </div>
  );
}

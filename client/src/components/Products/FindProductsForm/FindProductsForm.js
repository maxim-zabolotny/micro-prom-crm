import { Button, Form, Input } from "antd";
import _ from "lodash";
import React, { useEffect } from "react";
import "./FindProductsForm.css";
import { strIsNumberRule } from "../../../utils/formRules/strIsNumberRule";
import { useSearchParams } from "react-router-dom";

const buildNextData = (data, values) => {
  const nextData = {
    ...data,
    ...values,
  };

  nextData.microtronId
    ? (nextData.microtronId = Number(nextData.microtronId))
    : (nextData.microtronId = null);

  nextData.promId
    ? (nextData.promId = Number(nextData.promId))
    : (nextData.promId = null);

  return nextData;
};

export function FindProductsForm({ data, fetch, productsSize }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    const nextData = buildNextData(data, searchParamsObj);
    fetch(nextData);
  }, []);

  const onFinish = (values) => {
    const nextData = buildNextData(data, values);
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
        initialValues={searchParamsObj}
        onValuesChange={(v) => {
          const newSearchParams = new URLSearchParams(searchParamsObj);

          Object.entries(v).forEach(([key, value]) => {
            if (_.isEmpty(value)) {
              newSearchParams.delete(key);
            } else {
              newSearchParams.set(key, value);
            }
          });

          setSearchParams(newSearchParams);
        }}
      >
        <Form.Item label="Имя товара" name="name">
          <Input placeholder={"Введите имя товара"} />
        </Form.Item>

        <Form.Item
          label="Microtron ID"
          name="microtronId"
          rules={[strIsNumberRule]}
        >
          <Input placeholder={"Введите Microtron ID"} />
        </Form.Item>

        <Form.Item label="Prom ID" name="promId" rules={[strIsNumberRule]}>
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

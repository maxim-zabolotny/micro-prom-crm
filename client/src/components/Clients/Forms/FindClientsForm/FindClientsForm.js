import { Button, Form, Input } from "antd";
import _ from "lodash";
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "./FindClientsForm.css";

export function FindClientsForm({ fetch, clientsSize, modifyUrl, showResult }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    if (modifyUrl) {
      fetch(searchParamsObj);
    }
  }, []);

  const onFinish = (values) => {
    fetch(values);
  };

  const resultInfo = (
    <div className={"find-clients-result-container"}>
      <div className={"find-clients-result-line"} />

      <div className={"find-clients-result"}>
        <p>Результат:</p>
        <span>
          <b>Найдено клиентов:</b> {clientsSize}
        </span>
      </div>
    </div>
  );

  return (
    <Form
      name="find-clients"
      labelCol={{ span: 2 }}
      wrapperCol={{ span: 10 }}
      onFinish={onFinish}
      initialValues={searchParamsObj}
      onValuesChange={(v) => {
        if (!modifyUrl) return;

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
      <Form.Item
        label="Информация про клиента"
        name="query"
        labelCol={{
          span: 6,
        }}
        wrapperCol={{
          span: 12,
        }}
      >
        <Input placeholder={"Введите имя, номер телефона или email"} />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Искать
        </Button>
      </Form.Item>

      {showResult ? resultInfo : null}
    </Form>
  );
}

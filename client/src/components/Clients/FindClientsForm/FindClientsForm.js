import { Button, Form, Input } from "antd";
import _ from "lodash";
import React, { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

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

  return (
    <div
      style={{
        border: "2px solid black",
        padding: "10px",
      }}
    >
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
        <Form.Item label="Информация про клиента" name="query">
          <Input placeholder={"Введите имя, номер телефона или email"} />
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
        </Form.Item>

        {showResult ? (
          <Form.Item label="Результат">
            <span className="ant-form-text">
              Найдено клиентов: {clientsSize}
            </span>
          </Form.Item>
        ) : null}
      </Form>
    </div>
  );
}

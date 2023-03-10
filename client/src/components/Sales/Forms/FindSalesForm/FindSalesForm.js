import { Button, Checkbox, Form, Input, Select } from "antd";
import _ from "lodash";
import React, { useEffect } from "react";
import { strIsNumberRule } from "../../../../utils/formRules/strIsNumberRule";
import { useSearchParams } from "react-router-dom";
import { SaleStatus } from "../../utils";
import "./FindSalesForm.css";

const buildNextData = (data, values) => {
  const nextData = {
    ...data,
    ...values,
  };

  nextData.productMicrotronId
    ? (nextData.productMicrotronId = Number(nextData.productMicrotronId))
    : (nextData.productMicrotronId = null);

  nextData.productPromId
    ? (nextData.productPromId = Number(nextData.productPromId))
    : (nextData.productPromId = null);

  if (typeof nextData.paid === "string") {
    nextData.paid = nextData.paid === "true";
  }

  return nextData;
};

export function FindSalesForm({ data, fetch, salesSize }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    const nextData = buildNextData(data, searchParamsObj);
    fetch(nextData);
  }, []);

  const onFinish = (values) => {
    const nextData = buildNextData(data, { ...searchParamsObj, ...values });
    fetch(nextData);
  };

  const onValuesChange = (values) => {
    const newSearchParams = new URLSearchParams(searchParamsObj);

    Object.entries(values).forEach(([key, value]) => {
      if (_.isBoolean(value)) {
        value ? newSearchParams.set(key, value) : newSearchParams.delete(key);
        return;
      }

      if (_.isEmpty(value)) {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });

    setSearchParams(newSearchParams);
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
    <Form
      name="find-sales"
      labelCol={{ span: 2 }}
      wrapperCol={{ span: 10 }}
      onFinish={onFinish}
      initialValues={searchParamsObj}
      onValuesChange={onValuesChange}
    >
      <Form.Item
        label={"????????????"}
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
      >
        <Select
          name={"status"}
          value={searchParams.get("status")}
          onSelect={(status) => onValuesChange({ status })}
        >
          <Select.Option value={SaleStatus.WaitDeliver}>
            ?? ???????????????? ????????????????
          </Select.Option>
          <Select.Option value={SaleStatus.Delivering}>??????????????????</Select.Option>
          <Select.Option value={SaleStatus.Sale}>????????????</Select.Option>
          <Select.Option value={SaleStatus.Canceled}>??????????????</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item label="?????? ????????????" name="productName">
        <Input placeholder={"?????????????? ?????? ????????????"} />
      </Form.Item>

      <Form.Item
        label="Microtron ID"
        name="productMicrotronId"
        rules={[strIsNumberRule]}
      >
        <Input placeholder={"?????????????? Microtron ID"} />
      </Form.Item>

      <Form.Item label="Prom ID" name="productPromId" rules={[strIsNumberRule]}>
        <Input placeholder={"?????????????? Prom ID"} />
      </Form.Item>

      <Form.Item label="??????????????" name="paid" valuePropName="checked">
        <Checkbox />
      </Form.Item>

      <Form.Item
        wrapperCol={{
          span: 12,
          offset: 2,
        }}
      >
        <Button type="primary" htmlType="submit">
          ????????????
        </Button>

        <Button
          htmlType="button"
          disabled={salesSize < data.limit}
          onClick={fetchNextProducts}
        >
          ?????????????????? ??????????????
        </Button>

        <Button
          htmlType="button"
          disabled={data.offset === 0}
          onClick={fetchPreviousProducts}
        >
          ???????????????????? ??????????????
        </Button>
      </Form.Item>

      <div className={"find-sales-result-container"}>
        <div className={"find-sales-result-line"} />

        <div className={"find-sales-result"}>
          <p>??????????????????:</p>
          <span>
            <b>?????????????????? ??????????????:</b> {data.offset} - {data.offset + salesSize}
          </span>
          <span>
            <b>?????????????? ????????????:</b> {salesSize}
          </span>
        </div>
      </div>
    </Form>
  );
}

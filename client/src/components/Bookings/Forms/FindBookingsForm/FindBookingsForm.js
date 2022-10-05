import { useSearchParams } from "react-router-dom";
import React, { useEffect } from "react";
import { Button, Form, Select } from "antd";
import "./FindBookingsForm.css";
import { BookingStatus } from "../../utils";

export function FindBookingsForm({ data, fetch, bookingsSize }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsObj = Object.fromEntries(searchParams.entries());

  useEffect(() => {
    const nextData = {
      ...data,
      ...searchParamsObj,
    };

    fetch(nextData);
  }, []);

  const onSelect = (status) => {
    const newSearchParams = new URLSearchParams(searchParamsObj);
    newSearchParams.set("status", status);

    setSearchParams(newSearchParams);
    fetch({
      ...data,
      status,
    });
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
      name="find-bookings"
      labelCol={{ span: 2 }}
      wrapperCol={{ span: 10 }}
      initialValues={searchParamsObj}
    >
      <Form.Item
        label={"Статус"}
        labelCol={{ span: 2 }}
        wrapperCol={{ span: 10 }}
      >
        <Select
          name={"status"}
          value={searchParams.get("status")}
          onSelect={onSelect}
        >
          <Select.Option value={BookingStatus.Wait}>В ожидании</Select.Option>
          <Select.Option value={BookingStatus.Approve}>
            Подтверждён
          </Select.Option>
          <Select.Option value={BookingStatus.Disapprove}>
            Отклонён
          </Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        wrapperCol={{
          span: 12,
          offset: 2,
        }}
        className={"find-bookings-buttons"}
      >
        <Button
          htmlType="button"
          disabled={bookingsSize < data.limit}
          onClick={fetchNextProducts}
        >
          Следующие бронирования
        </Button>

        <Button
          htmlType="button"
          disabled={data.offset === 0}
          onClick={fetchPreviousProducts}
        >
          Предыдущие бронирования
        </Button>
      </Form.Item>

      <div className={"find-bookings-result-container"}>
        <div className={"find-bookings-result-line"} />

        <div className={"find-bookings-result"}>
          <p>Результат:</p>
          <span>
            <b>Показаные бронирования:</b> {data.offset} -{" "}
            {data.offset + bookingsSize}
          </span>
          <span>
            <b>Найдено бронирований:</b> {bookingsSize}
          </span>
        </div>
      </div>
    </Form>
  );
}

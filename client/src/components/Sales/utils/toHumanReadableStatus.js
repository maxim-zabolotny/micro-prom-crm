import { SaleStatus } from "./SaleStatus";

export function toHumanReadableStatus(status) {
  switch (status) {
    case SaleStatus.WaitDeliver: {
      return "В ожидании отправки";
    }
    case SaleStatus.Delivering: {
      return "Отправлен";
    }
    case SaleStatus.Sale: {
      return "Продан";
    }
    case SaleStatus.Canceled: {
      return "Отменен";
    }
  }
}

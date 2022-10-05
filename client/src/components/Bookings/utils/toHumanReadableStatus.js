import { BookingStatus } from "./BookingStatus";

export function toHumanReadableStatus(status) {
  switch (status) {
    case BookingStatus.Wait: {
      return "В ожидании";
    }
    case BookingStatus.Approve: {
      return "Подтвержден";
    }
    case BookingStatus.Disapprove: {
      return "Отменен";
    }
  }
}

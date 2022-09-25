export function strIsNumberRule() {
  return {
    message: "Должно быть числом",
    type: "number",
    transform: (v) => {
      const result = Number(v);
      return Number.isNaN(result) ? v : result;
    },
  };
}

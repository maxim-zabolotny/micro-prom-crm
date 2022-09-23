export function isUnauthorizedError(err) {
  const isErrorWithResponse = !!err.response;

  if (isErrorWithResponse) {
    const { status, statusText } = err.response;
    return status === 401 && statusText === "Unauthorized";
  }

  return false;
}

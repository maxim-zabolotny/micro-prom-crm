import "./ShortClient.css";

export function ShortClient({ client }) {
  const phones =
    client.phones.length > 0 ? (
      <span>
        <b>Телефоны:</b> {client.phones.join(", ")}
      </span>
    ) : null;

  const emails =
    client.emails.length > 0 ? (
      <span>
        <b>Emails:</b> {client.emails.join(", ")}
      </span>
    ) : null;

  return (
    <div className={"short-client-container"}>
      <span>
        <b>Имя:</b> {client.client_full_name}
      </span>
      {phones}
      {emails}
    </div>
  );
}

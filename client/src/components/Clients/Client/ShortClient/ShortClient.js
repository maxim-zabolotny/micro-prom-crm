export function ShortClient({ client }) {
  const phones =
    client.phones.length > 0 ? (
      <span>
        <b>Phones:</b> {client.phones.join(", ")}
      </span>
    ) : null;

  const emails =
    client.emails.length > 0 ? (
      <span>
        <b>Emails:</b> {client.emails.join(", ")}
      </span>
    ) : null;

  return (
    <div
      style={{
        border: "2px solid black",
        margin: "10px 5px",
        display: "flex",
        flexDirection: "row",
      }}
    >
      <span>
        <b>Name:</b> {client.client_full_name}
      </span>
      {phones}
      {emails}
    </div>
  );
}

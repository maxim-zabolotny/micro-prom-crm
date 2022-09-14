export default () => {
  const rules = {
    adminIsSuperuser: Boolean(Number(process.env.ADMIN_IS_SUPERUSER)),
  };

  const redis = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  };

  const mongo = {
    host: process.env.MONGO_HOST,
    port: parseInt(process.env.MONGO_PORT, 10),
    // username: process.env.MONGO_USER,
    // password: process.env.MONGO_PASSWORD,
    name: process.env.MONGO_DATABASE_NAME,
    url: '', // mongodb://username:password@host:port/database
  };
  // mongo.url = `mongodb://${mongo.username}:${mongo.password}@${mongo.host}:${mongo.port}`;
  mongo.url = `mongodb://${mongo.host}:${mongo.port}`;

  const telegram = {
    webhook: process.env.TELEGRAM_WEBHOOK,
    token: process.env.TELEGRAM_TOKEN,
    botName: process.env.TELEGRAM_BOT_NAME,
  };

  const google = {
    serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
  };

  const client = {
    domain: process.env.CLIENT_TUNNEL_DOMAIN,
    localPort: process.env.CLIENT_LOCAL_PORT,
    url: '',
  };
  client.url = `http://${client.domain}.loca.lt`;

  const jwtToken = {
    secret: process.env.TOKEN_SECRET,
    expireMinutes: parseInt(process.env.TOKEN_EXPIRE_MINUTES, 10),
  };

  const tokens = {
    microtron: process.env.MICROTRON_TOKEN,
    prom: process.env.PROM_TOKEN,
    ngrok: process.env.NGROK_TOKEN,
  };

  const cors = {
    whiteList: [client.url, `http://localhost:${client.localPort}`],
  };

  const PORT = parseInt(process.env.PORT, 10);

  return {
    port: PORT,
    host: `http://localhost:${PORT}`,
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    client,
    cors,
    redis,
    mongo,
    telegram,
    google,
    jwtToken,
    tokens,
    rules,
  };
};

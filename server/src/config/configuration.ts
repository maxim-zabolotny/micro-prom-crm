export default () => {
  const redis = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  };

  const mongo = {
    host: process.env.MONGO_HOST,
    port: parseInt(process.env.MONGO_PORT, 10),
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    name: process.env.MONGO_DATABASE_NAME,
    url: '', // mongodb://username:password@host:port/database
  };
  mongo.url = `mongodb://${mongo.username}:${mongo.password}@${mongo.host}:${mongo.port}`;

  const telegram = {
    webhook: process.env.TELEGRAM_WEBHOOK,
    token: process.env.TELEGRAM_TOKEN,
    botName: process.env.TELEGRAM_BOT_NAME,
  };

  const token = {
    secret: process.env.TOKEN_SECRET,
    expireMinutes: parseInt(process.env.TOKEN_EXPIRE_MINUTES, 10),
  };

  const tokens = {
    microtron: process.env.MICROTRON_TOKEN,
    prom: process.env.PROM_TOKEN,
    ngrok: process.env.NGROK_TOKEN,
  };

  const PORT = parseInt(process.env.PORT, 10);

  return {
    port: PORT,
    host: `http://localhost:${PORT}`,
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    redis,
    mongo,
    telegram,
    token,
    tokens,
  };
};

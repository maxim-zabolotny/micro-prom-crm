export default () => {
  const redis = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT, 10),
  }

  const mongo = {
    host: process.env.MONGO_HOST,
    port: parseInt(process.env.MONGO_PORT, 10),
    username: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    name: process.env.MONGO_DATABASE_NAME,
    url: '' // mongodb://username:password@host:port/database
  }
  mongo.url = `mongodb://${mongo.username}:${mongo.password}@${mongo.host}:${mongo.port}`;

  const secrets = {
    jwt: process.env.JWT_SECRET,
  }

  const tokens = {
    microtron: process.env.MICROTRON_TOKEN,
    prom: process.env.PROM_TOKEN,
  }

  const PORT = parseInt(process.env.PORT, 10);

  return {
    host: `http://localhost:${PORT}`,
    port: PORT,
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'development',
    isProd: process.env.NODE_ENV === 'production',
    redis,
    mongo,
    secrets,
    tokens,
  }
};
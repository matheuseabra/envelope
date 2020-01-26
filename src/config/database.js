const mongoose = require('mongoose');

const DB_URL = process.env.MONGO_DB_URL;

const mongoConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
};

const db = mongoose
  .connect(DB_URL, mongoConfig)
  .then(() => console.log('Database connection started'));

module.exports = db;

const { Pool } = require("pg");
require('dotenv').config()


module.exports = new Pool({
  host: process.env.DATABASE_HOST, 
  user: process.env.DATABASE_USER,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});
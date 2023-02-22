import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();
const poolCluster = mysql.createPoolCluster();
poolCluster.add("node0", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  charset: process.env.DB_CHARSET,
});

export default poolCluster;
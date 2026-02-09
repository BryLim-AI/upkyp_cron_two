import mysql from "mysql2/promise";

// Create a connection pool (recommended for cron jobs)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Important for dates like CURDATE(), DATE_ADD
  timezone: "Z",
  decimalNumbers: true,
});

// Optional: basic health check on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log("✅ Database connected (cron service)");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }
})();

export default pool;

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

(async () => {
  try {
    // Generate hashes for common passwords: '123456' and 'Kartik@123'
    const hashSimple = await bcrypt.hash('123456', 10);
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'Gilbil@2006',
      database: process.env.DB_NAME || 'campus_grievance'
    });

    await conn.query(
      `UPDATE users SET password_hash = ? WHERE email = 'kartiknigam31@gmail.com';`,
      [hashSimple]
    );

    console.log('[MySQL] Password for kartiknigam31@gmail.com updated to: 123456');
    await conn.end();
  } catch (err) {
    console.error('[Error]:', err.message);
  }
})();

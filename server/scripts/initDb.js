const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function initializeDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const dbName = process.env.DB_NAME || 'campus_grievance';

  try {
    const rootConnection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sqlScript = fs.readFileSync(schemaPath, 'utf8');
      await rootConnection.query(sqlScript);
      console.log(`[DbInitializer] Database "${dbName}" checked & verified cleanly.`);
    }

    await rootConnection.end();
  } catch (err) {
    console.error('[DbInitializer Error]:', err.message);
  }
}

if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;

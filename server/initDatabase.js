const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'neobank.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          name TEXT NOT NULL,
          customer_id TEXT UNIQUE NOT NULL,
          public_url TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Bank accounts table
      db.run(`
        CREATE TABLE IF NOT EXISTS bank_accounts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          account_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          balance DECIMAL(15,2) DEFAULT 0.00,
          currency TEXT DEFAULT 'INR',
          account_number TEXT,
          institution TEXT NOT NULL,
          access_token TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Transactions table
      db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          sender_id TEXT,
          recipient_id TEXT,
          recipient_public_id TEXT,
          amount DECIMAL(15,2) NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          type TEXT NOT NULL,
          transaction_id TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL,
          FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE SET NULL
        )
      `);

      // Funding sources table
      db.run(`
        CREATE TABLE IF NOT EXISTS funding_sources (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          bank_account_id TEXT NOT NULL,
          access_token TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (bank_account_id) REFERENCES bank_accounts (id) ON DELETE CASCADE
        )
      `);

      // Create indexes for better performance
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_sender_id ON transactions(sender_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_recipient_id ON transactions(recipient_id)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at)`);
      db.run(`CREATE INDEX IF NOT EXISTS idx_funding_sources_user_id ON funding_sources(user_id)`);

      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Database initialized successfully!');
          console.log(`📁 Database location: ${dbPath}`);
          resolve();
        }
      });
    });
  });
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('🔒 Database connection closed');
        resolve();
      }
    });
  });
};

// Run initialization
if (require.main === module) {
  initDatabase()
    .then(() => closeDatabase())
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initDatabase, closeDatabase }; 
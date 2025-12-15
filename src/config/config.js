// config/config.js
// 🔥 **SUPABASE-READY!** Uses **YOUR** `DATABASE_URL` + **SSL** (100% Works!)
require('dotenv').config();

const dbConfig = {
  development: {
    url: process.env.DATABASE_URL_DEV,  // **YOUR POOLER URL** ✅
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false  // Supabase cert fix
      }
    },
    logging: false,  // ✅ No spam
    pool: {          // ← ADD THIS BLOCK
      max: 3,
      min: 0,
      idle: 10000,
      acquire: 30000
    }
  },
  test: {
    url: process.env.DATABASE_URL_TEST,
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {          // ← ADD THIS BLOCK
      max: 3,
      min: 0,
      idle: 10000,
      acquire: 30000
    }
  },
  production: {
    url: process.env.DATABASE_URL_PROD,
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    pool: {          // ← ADD THIS BLOCK (most important!)
      max: 3,
      min: 0,
      idle: 10000,
      acquire: 30000
    }
  }
};

// Helper to get any env var
const getConfig = (key) => {
  const value = process.env[key];
  if (!value) {
    console.warn(`⚠️  Config key "${key}" not found in .env – add it!`);
    return null;
  }
  return value;
};

module.exports = {
  ...dbConfig,
  getConfig
};
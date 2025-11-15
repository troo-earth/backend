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
    logging: false  // ✅ No spam
  },
  test: {
    url: process.env.DATABASE_URL_TEST,  // **Bonus: Separate test DB?**
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  },
  production: {
    url: process.env.DATABASE_URL_PROD,  // **Deploy: Set in Vercel/Render**
    dialect: 'postgres',
    ssl: true,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
};

// Helper to get any env var (e.g., ICR_API_KEY) – used in integrations/auth.js
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
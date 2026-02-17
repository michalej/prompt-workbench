const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/prompt_workbench';
const client = new MongoClient(uri);
let db;

async function connect() {
  if (db) return db;
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB');
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not connected');
  return db;
}

module.exports = { connect, getDb };

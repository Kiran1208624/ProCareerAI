import { MongoClient } from 'mongodb'

let client
let db

export async function connectToMongo() {
  if (db) {
    return db
  }

  if (!process.env.MONGO_URL) {
    throw new Error('MONGO_URL is not configured')
  }

  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
  }

  await client.connect()

  db = client.db(process.env.DB_NAME || 'veyra_ai')

  if (!db) {
    throw new Error('Failed to initialize MongoDB database')
  }

  return db
}
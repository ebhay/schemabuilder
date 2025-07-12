import { MongoClient } from 'mongodb'
import mongoose from 'mongoose'

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const uri = process.env.MONGODB_URI!

if (!uri || !uri.includes('mongodb')) {
  throw new Error('Invalid MongoDB URI. Please check your .env.local file')
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
}

const client = new MongoClient(uri, options)
const clientPromise = global._mongoClientPromise ?? client.connect()

if (process.env.NODE_ENV === 'development') {
  global._mongoClientPromise = clientPromise
}

// Initialize Mongoose connection
if (mongoose.connection.readyState === 0) {
  mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  }).then(() => {
    console.log('✅ Mongoose connected successfully')
  }).catch((error) => {
    console.error('❌ Mongoose connection error:', error)
  })
}

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error)
})

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB')
})

export default clientPromise

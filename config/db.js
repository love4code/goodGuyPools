const mongoose = require('mongoose')

async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/goodfella_pools'
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error('Mongo connection error:', err.message)
    process.exit(1)
  }
}

module.exports = connectDB



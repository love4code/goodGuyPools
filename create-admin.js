require('dotenv').config()
const mongoose = require('mongoose')
const AdminUser = require('./models/AdminUser')

async function createAdmin() {
  try {
    // Connect to MongoDB using the same connection logic as the app
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/goodfella_pools'
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({
      email: 'markagrover85@gmail.com'
    })

    if (existingAdmin) {
      console.log('Admin user already exists!')
      console.log('Updating password...')
      
      // Update password using the createWithPassword method logic
      const bcrypt = require('bcrypt')
      const saltRounds = 10
      existingAdmin.passwordHash = await bcrypt.hash('admin123', saltRounds)
      await existingAdmin.save()
      console.log('Admin user password updated successfully!')
    } else {
      // Create new admin user using the static method
      await AdminUser.createWithPassword(
        'markagrover85@gmail.com',
        'admin123',
        'Admin'
      )
      console.log('Admin user created successfully!')
    }

    console.log('\nAdmin credentials:')
    console.log('Email: markagrover85@gmail.com')
    console.log('Password: admin123')
    console.log('Role: Admin')

    process.exit(0)
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()


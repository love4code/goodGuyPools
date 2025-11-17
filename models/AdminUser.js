const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const adminUserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
})

adminUserSchema.methods.verifyPassword = async function (password) {
  try {
    if (!password || !this.passwordHash) return false
    return await bcrypt.compare(password, this.passwordHash)
  } catch (e) {
    return false
  }
}

adminUserSchema.statics.createWithPassword = async function (email, password, name) {
  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)
  return this.create({ email, passwordHash, name })
}

module.exports = mongoose.model('AdminUser', adminUserSchema)



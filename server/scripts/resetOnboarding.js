#!/usr/bin/env node
import 'dotenv/config'
import mongoose from 'mongoose'
import connectDB from '../utils/connectDB.js'
import User from '../models/user.model.js'

// Usage:
// node server/scripts/resetOnboarding.js            -> reset for all users
// node server/scripts/resetOnboarding.js username   -> reset for a single user

async function main() {
  await connectDB()
  const username = process.argv[2]
  if (username) {
    const user = await User.findOne({ username })
    if (!user) {
      console.error('User not found')
      process.exit(1)
    }
    user.mailSettings = { ...(user.mailSettings || {}), tourDone: false }
    await user.save()
    console.log(`Reset onboarding for ${username}`)
  } else {
    await User.updateMany({}, { $set: { 'mailSettings.tourDone': false } })
    console.log('Reset onboarding for all users')
  }
  await mongoose.disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })

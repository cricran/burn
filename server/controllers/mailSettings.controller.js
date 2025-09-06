import User from '../models/user.model.js'

export async function getMailSettings(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { mailSettings } = user
    return res.status(200).json({ mailSettings: mailSettings || { email: '', login: '', tourDone: false } })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to get mail settings' })
  }
}

export async function updateMailSettings(req, res) {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { email, login, tourDone } = req.body || {}
    const next = { ...user.mailSettings }
    if (typeof email === 'string') next.email = email.trim()
    if (typeof login === 'string') next.login = login.trim()
    if (typeof tourDone === 'boolean') next.tourDone = tourDone
    user.mailSettings = next
    await user.save()
    return res.status(200).json({ mailSettings: user.mailSettings })
  } catch (e) {
    return res.status(500).json({ error: 'Failed to update mail settings' })
  }
}

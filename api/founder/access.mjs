import { requireFounder } from '../../server/founder.mjs'
import { sendError } from '../../server/supabaseAdmin.mjs'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' })
  try {
    const { user } = await requireFounder(req)
    return res.status(200).json({ founder: true, email: user.email })
  } catch (error) {
    return sendError(res, error)
  }
}

export default function handler(req, res) {
  res.json({ status: 'ok', hasApiKey: !!process.env.ANTHROPIC_API_KEY })
}

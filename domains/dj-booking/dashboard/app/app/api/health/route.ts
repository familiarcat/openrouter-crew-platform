export async function GET() {
  return Response.json({ 
    status: 'healthy',
    service: 'frontend',
    timestamp: new Date().toISOString()
  })
}

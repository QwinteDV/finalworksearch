export async function GET() {
  return Response.json({ 
    message: 'API routes are working!',
    timestamp: new Date().toISOString()
  });
}
// Mock Analytics Endpoint for Development
// This is a simple endpoint that handles analytics data

export default function handler(req, res) {
  // Only allow this endpoint on localhost/development
  const host = req.headers.host || '';
  const isLocalhost = host.includes('localhost') || 
                     host.includes('127.0.0.1') || 
                     host.startsWith('192.168.') ||
                     host.startsWith('10.0.') ||
                     process.env.NODE_ENV === 'development';

  if (!isLocalhost) {
    return res.status(404).json({ error: 'Not found' });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { events, session_id, timestamp } = req.body;

    // Log analytics data for development
    console.log(' Analytics Data Received:');
    console.log(`Session ID: ${session_id}`);
    console.log(`Timestamp: ${new Date(timestamp).toISOString()}`);
    console.log(`Events Count: ${events?.length || 0}`);
    
    if (events && events.length > 0) {
      events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          type: event.type,
          category: event.category,
          action: event.action,
          timestamp: new Date(event.timestamp).toISOString()
        });
      });
    }

    // In a real implementation, you would:
    // 1. Validate the data
    // 2. Store it in a database
    // 3. Apply privacy filtering
    // 4. Rate limiting
    
    // For now, just return success
    res.status(200).json({ 
      success: true, 
      message: 'Analytics data received',
      processed: events?.length || 0
    });

  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

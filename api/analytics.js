// Analytics Endpoint for Vercel Deployment
// This endpoint handles analytics data from the client

export default function handler(req, res) {
  // Set CORS headers for specific domains only (matches other API endpoints)
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "https://trietdev.com",
    "https://www.trietdev.com",
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { events, session_id, timestamp } = req.body;

    // Log analytics data for development
    console.log(" Analytics Data Received:");
    console.log(`Session ID: ${session_id}`);
    console.log(`Timestamp: ${new Date(timestamp).toISOString()}`);
    console.log(`Events Count: ${events?.length || 0}`);

    if (events && events.length > 0) {
      events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`, {
          type: event.type,
          category: event.category,
          action: event.action,
          timestamp: new Date(event.timestamp).toISOString(),
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
      message: "Analytics data received",
      processed: events?.length || 0,
    });
  } catch (error) {
    console.error("Analytics endpoint error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

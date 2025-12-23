const express = require("express");
const cors = require("cors"); // npm install cors
const app = express();

// 1. Middleware to handle CORS and JSON parsing automatically
app.use(cors({ origin: true })); // 'true' allows all origins
app.use(express.json());

// 2. The Endpoint
app.post("/api/ingest", async (req, res) => {
  try {
    const events = req.body; // Express parses the JSON for you

    // VALIDATION: Ensure it's an array
    if (!Array.isArray(events)) {
      return res.status(400).json({ error: "Payload must be an array" });
    }

    console.log(`Received batch of ${events.length} events`);

    // TODO: Save to your database (Postgres, MongoDB, SQLite)
    // await db.insert(events);

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => console.log("Analytics server running on port 3000"));

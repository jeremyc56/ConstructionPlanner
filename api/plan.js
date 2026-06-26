// Construction Planner — shared storage API (Vercel serverless function).
// Stores the whole planner state as a single value ("plan") in Vercel KV.
// No npm packages required: it talks to the KV REST API using the built-in fetch.
//
// Requires a Vercel KV (Upstash) database connected to the project, which provides
// the env vars KV_REST_API_URL and KV_REST_API_TOKEN automatically.

module.exports = async (req, res) => {
  const URL = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;
  res.setHeader("Cache-Control", "no-store");

  if (!URL || !TOKEN) {
    res.status(500).json({
      error:
        "Shared storage isn't connected yet. In Vercel: open this project → Storage → create a KV database → connect it → redeploy."
    });
    return;
  }

  const auth = { Authorization: "Bearer " + TOKEN };

  try {
    if (req.method === "GET") {
      const r = await fetch(URL + "/get/plan", { headers: auth, cache: "no-store" });
      const j = await r.json();
      const val = j && j.result ? JSON.parse(j.result) : null;
      res.status(200).json(val);
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      let body = req.body;
      if (body && typeof body !== "string") body = JSON.stringify(body);
      if (!body) {
        res.status(400).json({ error: "empty body" });
        return;
      }
      const r = await fetch(URL + "/set/plan", {
        method: "POST",
        headers: Object.assign({ "Content-Type": "text/plain" }, auth),
        body: body
      });
      if (!r.ok) throw new Error("KV write failed: " + r.status);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "method not allowed" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};

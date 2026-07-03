// Construction Planner — AI assistant API (Vercel serverless function).
// Proxies requests to the Claude API so the key stays server-side.
//
// Setup: in Vercel → Project → Settings → Environment Variables, add
//   ANTHROPIC_API_KEY = <your key from console.anthropic.com>
// then redeploy. Optional: ANTHROPIC_MODEL to override the default model.

var MODEL_DEFAULT = "claude-sonnet-5";
var MAX_BODY = 200000; // ~200 KB of context is plenty

function sys(action) {
  var base =
    "You are the scheduling assistant inside CYCON Group's Construction Planner web app. " +
    "The user is a civil construction engineer in Victoria, Australia. " +
    "You are given the current schedule as JSON: tasks have name, start (YYYY-MM-DD), duration (days), zone, crew, status, progress. " +
    "Weather is a daily forecast list with rain (mm), pop (% chance of rain) and tmax (°C). " +
    "Dates are local Melbourne dates. Be concise, practical and site-focused. Plain text only — no markdown headers or asterisks.";
  if (action === "summary")
    return base +
      " Write a short lookahead summary suitable for a toolbox talk or an email to the superintendent: " +
      "group by zone, note key activities day by day, call out public holidays/RDOs, and flag anything weather-exposed. Keep it under 250 words.";
  if (action === "risks")
    return base +
      " Review the schedule against the weather forecast. Flag weather-sensitive activities (concrete pours, asphalt, linemarking, trimming, kerb, earthworks in rain) " +
      "scheduled on days with meaningful rain (>2mm or >60% chance). For each risk give: the task, the date, why it's a risk, and a suggested move (e.g. shift to a drier day nearby). " +
      "If nothing is at risk, say so. Short bullet lines, one per risk.";
  if (action === "tasks")
    return "You convert free-form construction scheduling notes into structured tasks. " +
      "Today's date and existing zones are provided in the context JSON. " +
      "Respond with ONLY a JSON array, no prose, where each element is " +
      '{"name":string,"start":"YYYY-MM-DD","duration":number,"zone":string,"crew":string}. ' +
      "Rules: resolve relative dates (e.g. 'next Tuesday') against the provided today; duration defaults to 1; " +
      "zone should match an existing zone when the text implies one, else empty string; crew empty string unless stated. " +
      "Keep names short like a programme line item.";
  return base + " Answer the user's question about their schedule.";
}

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  var KEY = process.env.ANTHROPIC_API_KEY;
  if (!KEY) {
    res.status(501).json({ error: "not_configured" });
    return;
  }
  try {
    var body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    if (!body || typeof body !== "object") throw new Error("bad body");
    var action = String(body.action || "ask");
    var prompt = String(body.prompt || "").slice(0, 4000);
    var context = JSON.stringify(body.context || {}).slice(0, MAX_BODY);

    var userMsg =
      "CONTEXT (schedule + weather JSON):\n" + context +
      "\n\nREQUEST:\n" + (prompt || "(no extra instructions)");

    var r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || MODEL_DEFAULT,
        max_tokens: 1500,
        system: sys(action),
        messages: [{ role: "user", content: userMsg }]
      })
    });
    var j = await r.json();
    if (!r.ok) {
      res.status(502).json({ error: (j && j.error && j.error.message) || ("upstream " + r.status) });
      return;
    }
    var text = "";
    if (j && j.content) {
      for (var i = 0; i < j.content.length; i++) {
        if (j.content[i].type === "text") text += j.content[i].text;
      }
    }
    if (action === "tasks") {
      // Extract the JSON array even if the model wrapped it in stray text/fences.
      var m = text.match(/\[[\s\S]*\]/);
      var tasks = [];
      if (m) {
        try {
          var arr = JSON.parse(m[0]);
          if (Array.isArray(arr)) {
            for (var k = 0; k < arr.length && tasks.length < 60; k++) {
              var t = arr[k];
              if (!t || typeof t !== "object") continue;
              var name = String(t.name || "").slice(0, 120).trim();
              var start = String(t.start || "");
              if (!name || !/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;
              var dur = parseInt(t.duration, 10);
              tasks.push({
                name: name,
                start: start,
                duration: isNaN(dur) ? 1 : Math.min(365, Math.max(1, dur)),
                zone: String(t.zone || "").slice(0, 120),
                crew: String(t.crew || "").slice(0, 120)
              });
            }
          }
        } catch (e) {}
      }
      res.status(200).json({ tasks: tasks, text: tasks.length ? "" : text });
      return;
    }
    res.status(200).json({ text: text });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};

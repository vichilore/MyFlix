// netlify/functions/iptv-proxy.js
// CommonJS per Netlify Functions
const TIMEOUT_MS = 15000;

exports.handler = async (event, context) => {
  try {
    const { IPTV_BASE, IPTV_USERNAME, IPTV_PASSWORD } = process.env;

    if (!IPTV_BASE || !IPTV_USERNAME || !IPTV_PASSWORD) {
      console.error("[iptv-proxy] Missing env vars");
      return {
        statusCode: 500,
        body: "Missing IPTV env vars (IPTV_BASE, IPTV_USERNAME, IPTV_PASSWORD)"
      };
    }

    // Consenti override via query per debug ?type=m3u_plus&output=mpegts
    const url = new URL(IPTV_BASE.replace(/\/+$/, "") + "/get.php");
    url.searchParams.set("username", IPTV_USERNAME);
    url.searchParams.set("password", IPTV_PASSWORD);
    url.searchParams.set("type", event.queryStringParameters?.type || "m3u_plus");
    url.searchParams.set("output", event.queryStringParameters?.output || "mpegts");

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let resp;
    try {
      resp = await fetch(url.toString(), {
        method: "GET",
        headers: { "User-Agent": "NetlifyFunction/iptv-proxy" },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await resp.text();
    // Forward dello status reale per capire errori upstream
    return {
      statusCode: resp.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "audio/x-mpegurl; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: text
    };
  } catch (e) {
    console.error("[iptv-proxy] Error:", e && e.stack || e);
    return { statusCode: 502, body: "Proxy error: " + String(e) };
  }
};

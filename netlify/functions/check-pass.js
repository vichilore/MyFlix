// netlify/functions/check-pass.js
exports.handler = async (event) => {
  try {
    const SECRET = process.env.SITE_PASSWORD; // password salvata su Netlify (non nel codice)
    const body = JSON.parse(event.body || '{}');
    const attempt = (body.password || '').trim();

    if (attempt === SECRET) {
      // Risposta OK
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    } else {
      // Password errata
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: false })
      };
    }
  } catch (err) {
    return { statusCode: 500, body: 'Errore interno' };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const formData = await req.formData();
  const upstream = await fetch(
    'https://nonepisodically-influential-marya.ngrok-free.dev/scan',
    {
      method: 'POST',
      headers: { 'X-API-Key': 'GUC_Super_Secret_Key_2026' },
      body: formData,
    }
  );

  if (!upstream.ok) return res.status(upstream.status).end();

  const midi = await upstream.arrayBuffer();
  res.setHeader('Content-Type', 'audio/midi');
  res.send(Buffer.from(midi));
}

export const config = { api: { bodyParser: false } };

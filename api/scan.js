import formidable from 'formidable';
import fetch from 'node-fetch';
import fs from 'fs';
import FormData from 'form-data';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({});
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parse error' });

    const file = files.file?.[0];
    const engine = fields.engine?.[0] || 'audiveris';

    const fd = new FormData();
    fd.append('engine', engine);
    fd.append('file', fs.createReadStream(file.filepath), file.originalFilename);

    try {
      const upstream = await fetch(
        'https://nonepisodically-influential-marya.ngrok-free.dev/scan',
        {
          method: 'POST',
          headers: {
            'X-API-Key': 'GUC_Super_Secret_Key_2026',
            ...fd.getHeaders()
          },
          body: fd,
        }
      );
      if (!upstream.ok) return res.status(upstream.status).end();
      const midi = await upstream.arrayBuffer();
      res.setHeader('Content-Type', 'audio/midi');
      res.send(Buffer.from(midi));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
}

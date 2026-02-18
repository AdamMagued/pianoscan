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
    fd.append('file', fs.createReadStream(file.filepath), {
      filename: file.originalFilename,
      contentType: file.mimetype,          // preserves application/pdf vs image/jpeg
    });

    try {
      const upstream = await fetch(
        'http://192.168.1.224:8001/scan',   // direct LAN — no ngrok needed
        {
          method: 'POST',
          headers: {
            'X-API-Key': 'GUC_Super_Secret_Key_2026',
            ...fd.getHeaders()
          },
          body: fd,
          timeout: engine === 'homr' ? 300000 : 180000,
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

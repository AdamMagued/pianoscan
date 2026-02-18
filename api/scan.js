import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false, // Required for formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const data = await new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });

  const file = data.files.file?.[0]  data.files.file;
  const engine = data.fields.engine?.[0] 
 'audiveris';

  if (!file) return res.status(400).json({ error: 'No file' });

  const formData = new FormData();
  formData.append('engine', engine);
  formData.append('file', fs.createReadStream(file.filepath), {
    filename: file.originalFilename,
    contentType: file.mimetype,
  });

  try {
    const upstream = await fetch('https://nonepisodically-influential-marya.ngrok-free.dev/scan', {
      method: 'POST',
      headers: {
        'X-API-Key': 'GUC_Super_Secret_Key_2026',
        ...formData.getHeaders(), // Critical for file upload boundary
      },
      body: formData,
      timeout: 300000,
    });

    if (!upstream.ok) {
      const err = await upstream.text();
      return res.status(upstream.status).send(err);
    }

    const midi = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/midi');
    res.send(Buffer.from(midi));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
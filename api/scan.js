import { IncomingForm } from 'formidable';
import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Parse the file from the browser
    const data = await new Promise((resolve, reject) => {
      const form = new IncomingForm();
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve({ fields, files });
      });
    });

    // 2. Get the file (support both old and new formidable structures)
    const file = data.files.file?.[0] || data.files.file;
    const engine = data.fields.engine?.[0] || data.fields.engine || 'homr';

    if (!file) return res.status(400).json({ error: 'No file found' });

    console.log(`[Vercel] Forwarding ${file.originalFilename} (engine: ${engine}) to backend...`);

    // 3. Prepare the form data for Python
    const formData = new FormData();
    formData.append('engine', engine);
    formData.append('file', fs.createReadStream(file.filepath), {
      filename: file.originalFilename,
      contentType: file.mimetype,
    });

    // 4. Send to your PC via Ngrok
    const response = await fetch('https://nonepisodically-influential-marya.ngrok-free.dev/scan', {
      method: 'POST',
      headers: {
        'X-API-Key': 'GUC_Super_Secret_Key_2026',
        ...formData.getHeaders(),
      },
      body: formData,
    });

    // 5. Handle the response
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Vercel] Backend error ${response.status}:`, errorText);
      return res.status(response.status).json({ error: 'Engine Error', details: errorText });
    }

    const midiBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/midi');
    res.send(Buffer.from(midiBuffer));

  } catch (error) {
    console.error('[Vercel Error]', error);
    return res.status(500).json({ error: 'Proxy Error', details: error.message });
  }
}

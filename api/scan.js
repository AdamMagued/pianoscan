const formidable = require('formidable');
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // Ensure you have this: npm install node-fetch

// Disable Next.js body parsing so formidable can handle the file
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Parse the Incoming Form (Browser -> Next.js)
    const form = formidable({ keepExtensions: true });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // 2. Extract File and Engine
    // Support both array (new formidable) and object (old formidable) formats
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    const engine = Array.isArray(fields.engine) ? fields.engine[0] : (fields.engine || 'homr');

    if (!uploadedFile) {
      console.error("❌ Node Error: No file found in request");
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log([Node] Processing ${uploadedFile.originalFilename} for Engine: ${engine});

    // 3. Prepare Payload (Next.js -> Python/Ngrok)
    const formData = new FormData();
    formData.append('engine', engine);
    formData.append('file', fs.createReadStream(uploadedFile.filepath), {
      filename: uploadedFile.originalFilename,
      contentType: uploadedFile.mimetype,
    });

    // 4. Send to Python via Ngrok
    const pythonUrl = 'https://nonepisodically-influential-marya.ngrok-free.dev/scan';

    console.log([Node] Forwarding to: ${pythonUrl});

    const pythonResponse = await fetch(pythonUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': 'GUC_Super_Secret_Key_2026',
        ...formData.getHeaders(), // CRITICAL: Adds the boundary string
      },
      body: formData,
      timeout: 300000, // 5 minutes for HOMR
    });

    // 5. Check Python Response
    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error(❌ Python Error (${pythonResponse.status}):, errorText);
      return res.status(pythonResponse.status).json({ 
        error: 'Python Server Error', 
        details: errorText 
      });
    }

    // 6. Success! Stream MIDI back to browser
    console.log("✅ Success! MIDI received from Python.");
    const midiBuffer = await pythonResponse.arrayBuffer();
    res.setHeader('Content-Type', 'audio/midi');
    res.send(Buffer.from(midiBuffer));

  } catch (error) {
    console.error('❌ Node Proxy Crash:', error);
    return res.status(500).json({ 
      error: 'Website Proxy Error', 
      details: error.message 
    });
  }
};
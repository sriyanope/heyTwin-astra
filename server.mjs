import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT || 4173);
const env = loadEnv();
const maxBodyBytes = 12 * 1024 * 1024;

function loadEnv() {
  const values = { ...process.env };
  const envPath = path.join(root, '.env');
  if (!fs.existsSync(envPath)) return values;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !values[match[1]]) values[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function sendJson(response, status, payload) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBodyBytes) {
        reject(Object.assign(new Error('Request is too large.'), { code: 'REQUEST_TOO_LARGE' }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('The request was not valid JSON.'), { code: 'INVALID_JSON' }));
      }
    });
    request.on('error', reject);
  });
}

function validImageDataUrl(value) {
  return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 240) : fallback;
}

function cleanRecommendation(item, index) {
  if (!item || typeof item !== 'object') return null;
  const imageUrl = typeof item.image_url === 'string' && /^(https?:\/\/|data:image\/)/.test(item.image_url) ? item.image_url : '';
  return {
    id: cleanText(item.id, `suggestion-${index + 1}`),
    category: cleanText(item.category, 'Suggested pairing'),
    colour: cleanText(item.colour || item.color, 'neutral'),
    pattern: cleanText(item.pattern, 'solid'),
    explanation: cleanText(item.explanation, 'The colour and texture create an easy balance with your item.'),
    image_url: imageUrl,
    image_label: imageUrl ? 'Provider image' : 'Illustrative pairing'
  };
}

function fallbackRecommendation(garment, index) {
  const palette = garment.category === 'top'
    ? [
        ['black', 'straight-leg denim', 'The relaxed denim balances the top and keeps the look easy for everyday wear.'],
        ['cream', 'wide-leg trousers', 'The lighter neutral lets the top colour stand out while keeping the proportions clean.'],
        ['olive', 'tailored trousers', 'The muted pairing works with the garment colour without competing with its pattern.']
      ]
    : [
        ['white', 'clean cotton shirt', 'The crisp light layer balances the bottom and makes the colour combination feel intentional.'],
        ['black', 'simple knit top', 'The neutral top lets the bottom be the focal point and works across occasions.'],
        ['blue', 'relaxed overshirt', 'The related cool tones create a calm combination while the layers add depth.']
      ];
  const [colour, category, explanation] = palette[index % palette.length];
  return {
    id: `illustrative-${index + 1}`,
    category,
    colour,
    pattern: 'solid',
    explanation,
    image_url: '',
    image_label: 'Illustrative pairing'
  };
}

async function analyze(payload) {
  const garment = {
    category: payload.garment?.category === 'bottom' ? 'bottom' : 'top',
    colour: cleanText(payload.garment?.colour, 'unknown colour'),
    pattern: cleanText(payload.garment?.pattern, 'unknown pattern')
  };
  const occasion = ['casual', 'work', 'going out'].includes(payload.occasion) ? payload.occasion : 'casual';

  if (!validImageDataUrl(payload.image_data_url)) {
    return { status: 400, body: { error: { code: 'INVALID_IMAGE', message: 'Choose a JPG, PNG or WebP garment photo.', recoverable: true } } };
  }

  if (!env.VISION_API_URL || !env.VISION_API_KEY || !env.VISION_MODEL) {
    return {
      status: 200,
      body: {
        source_state: 'fallback',
        source_label: 'Illustrative fallback: vision provider is not configured.',
        blocker: 'Set VISION_API_URL, VISION_API_KEY and VISION_MODEL in .env to enable live garment analysis.',
        garment,
        recommendations: [0, 1, 2].map((index) => fallbackRecommendation(garment, index))
      }
    };
  }

  const prompt = `You are heyTwin, a careful fashion styling assistant. Inspect the supplied garment photo and return JSON only. The user confirmed: category=${garment.category}, colour=${garment.colour}, pattern=${garment.pattern}, occasion=${occasion}. Preserve that item as the user's item. Recommend three complementary ${garment.category === 'top' ? 'bottoms' : 'tops'}. Do not infer body type or physical fit. Do not claim suggested items are owned by the user. Each recommendation must include id, category, colour, pattern, explanation, and image_url only if you have a permitted real image URL. Keep explanations under 25 words. JSON shape: {"garment":{"category":"top|bottom","colour":"string","pattern":"string"},"recommendations":[{"id":"string","category":"string","colour":"string","pattern":"string","explanation":"string","image_url":"https://..."}]}`;
  const providerResponse = await fetch(env.VISION_API_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.VISION_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: env.VISION_MODEL,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: payload.image_data_url } }] }],
      response_format: { type: 'json_object' }
    })
  });
  if (!providerResponse.ok) throw new Error(`Vision provider returned HTTP ${providerResponse.status}.`);
  const raw = await providerResponse.json();
  const content = raw?.choices?.[0]?.message?.content;
  const parsed = typeof content === 'string' ? JSON.parse(content) : content;
  const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations.map(cleanRecommendation).filter(Boolean).slice(0, 3) : [];
  if (!recommendations.length) throw new Error('Vision provider returned no valid recommendations.');
  return {
    status: 200,
    body: {
      source_state: 'live',
      source_label: 'Live vision recommendation',
      garment: { ...garment, ...(parsed.garment || {}) },
      recommendations
    }
  };
}

async function handleApi(request, response) {
  try {
    const payload = await readJson(request);
    const result = await analyze(payload);
    sendJson(response, result.status, result.body);
  } catch (error) {
    sendJson(response, 502, { error: { code: 'VISION_PROVIDER_ERROR', message: error.message || 'The vision service could not complete the request.', recoverable: true } });
  }
}

function serveStatic(request, response) {
  const requested = new URL(request.url, `http://${request.headers.host}`).pathname;
  const relative = requested === '/' ? 'index.html' : requested.replace(/^\/+/, '');
  const filePath = path.normalize(path.join(publicDir, relative));
  if (!filePath.startsWith(publicDir)) return sendJson(response, 404, { error: 'Not found' });
  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(response, 404, { error: 'Not found' });
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(filePath)] || 'application/octet-stream';
    response.writeHead(200, { 'content-type': `${type}; charset=utf-8` });
    response.end(data);
  });
}

http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/api/analyze') return handleApi(request, response);
  if (request.method === 'GET') return serveStatic(request, response);
  sendJson(response, 405, { error: 'Method not allowed' });
}).listen(port, () => console.log(`heyTwin running at http://localhost:${port}`));

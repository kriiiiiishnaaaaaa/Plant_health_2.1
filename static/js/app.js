document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('menuBtn');
  const menu = document.getElementById('mobileMenu');
  if (btn && menu) btn.addEventListener('click', () => menu.classList.toggle('hidden'));

  document.querySelectorAll('.nav-link').forEach(link => {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    if (link.getAttribute('href') === page) link.classList.add('active');
  });
});

function getApiKey() {
  return localStorage.getItem('gm_groq_key') || '';
}

async function groqAnalyzePlant(imageBase64, mimeType, language) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not set. Please set your Groq API key in Settings.');
  const langPrompt = { en: 'Respond in English.', hi: 'Respond in Hindi (हिंदी में जवाब दें).', bn: 'Respond in Bengali (বাংলায় উত্তর দিন).' }[language] || 'Respond in English.';
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
          { type: 'text', text: `You are Grow Mate AI, an expert plant health assistant. Analyze this plant leaf image carefully.\n\n${langPrompt}\n\nRespond ONLY in this exact JSON format (no extra text, no markdown):\n{\n  "status": "Healthy" or "Diseased",\n  "disease_name": "Disease name or 'None' if healthy",\n  "confidence": "High / Medium / Low",\n  "description": "2-3 sentence plain-language description of what you see",\n  "care_tips": ["tip 1", "tip 2", "tip 3"],\n  "severity": "None / Mild / Moderate / Severe",\n  "plant_type": "Best guess of plant type"\n}` }
        ]
      }],
      max_tokens: 1024
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  let raw = data.choices[0].message.content.trim();
  if (raw.startsWith('```')) { raw = raw.split('```')[1]; if (raw.startsWith('json')) raw = raw.slice(4); }
  return JSON.parse(raw.trim());
}

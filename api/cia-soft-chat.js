import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Ты AI-консультант компании CIA SOFT в Армении.
Помогай владельцам ресторанов, кафе, фудкортов, fast food, шаурмичных, баров и доставки подобрать POS-автоматизацию.

CIA SOFT занимается POS-автоматизацией ресторанного бизнеса в Армении.
Услуги: Poster POS, HDM фискализация, QR-оплаты, предоплаты, сервисный процент, возвраты, повторная печать, локальный архив чеков, обучение персонала, поддержка и индивидуальные интеграции.
Контакты: телефон и WhatsApp +374 98 61 50 05.
Тарифы: Start от 15 000 AMD, Business от 30 000 AMD, Pro от 50 000 AMD+.
Точная цена зависит от количества точек, касс, интеграций и объёма настройки.

Правила:
- Отвечай коротко, профессионально и понятно.
- Не называй себя ChatGPT. Ты AI-консультант CIA SOFT.
- Не придумывай невозможные гарантии.
- Если клиент заинтересован, предложи написать в WhatsApp: +374 98 61 50 05.
- Если вопрос не связан с POS, ресторанами, автоматизацией, HDM, QR или CIA SOFT, вежливо верни разговор к автоматизации бизнеса.
- Отвечай на языке клиента: русский, армянский или английский.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.OPENAI_API_KEY) return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });

  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: 'messages must be an array' });

    const safeMessages = messages
      .filter((m) => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role))
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 1200) }));

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.35,
      max_tokens: 420,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...safeMessages],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || 'Извините, сейчас не удалось получить ответ. Напишите нам в WhatsApp: +374 98 61 50 05.';
    return res.status(200).json({ answer });
  } catch (error) {
    console.error('CIA SOFT chat error:', error);
    return res.status(500).json({ error: 'AI consultant temporarily unavailable' });
  }
}

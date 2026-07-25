import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6IYDFf25ghALFf6EL_Aqw5WEMs4PdsgLfBOR3t1n-vgfA' });

export async function handleMessage(ctx) {
  if (!ctx.message?.voice) return;

  const statusMsg = await ctx.reply('🎙 در حال پردازش ویس و تبدیل به پرامپت...');

  try {
    const file = await ctx.api.getFile(ctx.message.voice.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${ctx.token}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const systemInstruction = `
تو یک دستیار حرفه‌ای ساخت پرامپت هستی.
فایل صوتی ارسال شده را تحلیل کن و:
۱. تمام تپق‌ها، مکث‌ها، تکرارها و کلمات اضافی (مثل 'امم'، 'چیز'، 'یعنی') را حذف کن.
۲. قصد و هدف اصلی کاربر را به یک پرامپت شفاف، کامل، بدون غلط نگارشی و کاملاً ساختاریافته تبدیل کن.
۳. زبان خروجی باید دقیقا مطابق زبان گفتار کاربر باشد (فارسی به فارسی، انگلیسی به انگلیسی).
۴. خروجی فقط و فقط باید خود متن پرامپت نهایی باشد و هیچ مقدمه یا توضیح اضافی ننویس.
`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemInstruction },
            {
              inlineData: {
                mimeType: 'audio/ogg',
                data: base64Audio,
              },
            },
          ],
        },
      ],
    });

    const finalPrompt = result.text.trim();
    const output = `✨ **پرامپت نهایی:**\n\n\`${finalPrompt}\``;
    await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, output, { parse_mode: 'Markdown' });

  } catch (err) {
    console.error(err);
    await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, 'خطایی رخ داد: ' + err.message);
  }
}
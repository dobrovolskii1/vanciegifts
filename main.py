
import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient, events, functions, types
from telethon.sessions import StringSession
import google.generativeai as genai
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# --- Конфигурация из окружения (Railway) ---
# Инициализация переменных (ОСТАВЛЯЕМ БЛОК НЕТРОНУТЫМ ПО ТРЕБОВАНИЮ)
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
SESSION_DATA = os.getenv('TELEGRAM_SESSION', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
MY_ID = 7991221711 

# Настройки стиля и доноров
# DONOR_CHANNELS всегда со знаком @
DONOR_CHANNELS_RAW = os.getenv('DONOR_CHANNELS', '@giftnews,@gift_newstg,@digest,@UaOnlii')
DONOR_CHANNELS = [c.strip() for c in DONOR_CHANNELS_RAW.split(',') if c.strip().startswith('@')]
REFERENCE_CHANNEL = os.getenv('REFERENCE_CHANNEL', '@my_channel_style')

# Настройка Gemini
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-3-flash-preview')

# Инициализация клиента через StringSession
if SESSION_DATA:
    client = TelegramClient(StringSession(SESSION_DATA), API_ID, API_HASH)
else:
    client = TelegramClient('my_session', API_ID, API_HASH)

async def get_style_examples():
    """Скачивает посты за последние 30 дней для глубокого анализа стиля"""
    print(f"📊 Начинаю глубокий анализ стиля {REFERENCE_CHANNEL} за последние 30 дней...")
    try:
        date_threshold = datetime.now(timezone.utc) - timedelta(days=30)
        examples = []
        
        # Перебираем сообщения за месяц (лимит 50 для стабильности контекста)
        async for message in client.iter_messages(REFERENCE_CHANNEL, limit=50):
            if message.date < date_threshold:
                break
            if message.text and len(message.text) > 40:
                examples.append(message.text)
        
        if not examples:
            print("⚠️ За месяц постов не найдено. Беру последние 5.")
            messages = await client.get_messages(REFERENCE_CHANNEL, limit=5)
            examples = [m.text for m in messages if m.text]

        context = "\n--- НОВЫЙ ПОСТ ---\n".join(examples)
        
        instruction = (
            f"Ты — профессиональный лингвист-аналитик. Перед тобой массив постов из канала {REFERENCE_CHANNEL} за последний месяц.\n"
            f"1. Изучи их тональность, ритм, использование сленга и эмодзи.\n"
            f"2. Обрати внимание на структуру (заголовки, списки, призывы).\n"
            f"3. Твоя задача: сделать рерайт новой новости так, чтобы он выглядел как родной пост в этом канале.\n"
            f"\nБАЗА ДЛЯ АНАЛИЗА СТИЛЯ:\n{context}"
        )
        return instruction
    except Exception as e:
        print(f"⚠️ Ошибка при сборе стиля за месяц: {e}")
        return "Стиль: лаконичный, информативный, современный Telegram-стиль."

async def rewrite_text(text):
    try:
        style_instruction = await get_style_examples()
        prompt = f"{style_instruction}\n\nНОВАЯ НОВОСТЬ ДЛЯ ОБРАБОТКИ:\n{text}\n\nНапиши готовый пост:"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ Ошибка Gemini API: {e}")
        return None

async def join_and_warmup():
    print("🔄 Синхронизация источников...")
    all_targets = list(set(DONOR_CHANNELS + [REFERENCE_CHANNEL]))
    for channel in all_targets:
        try:
            await client.get_entity(channel)
            if channel in DONOR_CHANNELS:
                await client(functions.channels.JoinChannelRequest(channel))
        except Exception as e:
            print(f"⚠️ Ошибка доступа к {channel}: {e}")

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def handler(event):
    chat_username = event.chat.username if hasattr(event.chat, 'username') else 'unknown'
    print(f"📩 Входящая новость от @{chat_username}")
    
    if not event.text or len(event.text) < 50:
        return

    print(f"🤖 Глубокий рерайт под стиль {REFERENCE_CHANNEL}...")
    rewritten = await rewrite_text(event.text)
    
    if rewritten:
        source_link = f"https://t.me/{chat_username}/{event.id}" if chat_username != 'unknown' else "link"
        
        final_post = (
            f"⚡️ **ВАРИАНТ ПОД ВАШ СТИЛЬ**\n\n"
            f"{rewritten}\n\n"
            f"--- \n"
            f"📥 Источник: @{chat_username}\n"
            f"🔗 [Оригинал]({source_link})"
        )
        
        await client.send_message(MY_ID, final_post, link_preview=False)
        print(f"🚀 Пост успешно адаптирован и отправлен!")

async def main():
    print("🛰 Бот-ассистент запускается...")
    await client.start()
    
    if not SESSION_DATA:
        print(f"\n🔑 СТРОКА СЕССИИ (TELEGRAM_SESSION):\n{client.session.save()}\n")

    await join_and_warmup()
    print("📡 Мониторинг запущен. Ожидаю новости.")
    await client.run_until_disconnected()

if __name__ == '__main__':
    logging.basicConfig(level=logging.WARNING)
    asyncio.run(main())

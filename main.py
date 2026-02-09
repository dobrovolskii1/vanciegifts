
import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient, events, functions, types, errors
from telethon.sessions import StringSession
import google.generativeai as genai
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

# --- Конфигурация ---
# Критично: API_HASH теперь берется только из переменных окружения Railway/системы
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
SESSION_DATA = os.getenv('TELEGRAM_SESSION', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
MY_ID = 7991221711 

# Настройки каналов
DONOR_CHANNELS_RAW = os.getenv('DONOR_CHANNELS', '@giftnews,@gift_newstg')
DONOR_CHANNELS = [c.strip() for c in DONOR_CHANNELS_RAW.split(',') if c.strip().startswith('@')]
REFERENCE_CHANNEL = os.getenv('REFERENCE_CHANNEL', '@my_channel_style')

# Настройка Gemini
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-3-flash-preview')

# Инициализация клиента Telethon
if SESSION_DATA:
    client = TelegramClient(StringSession(SESSION_DATA), API_ID, API_HASH)
else:
    client = TelegramClient('my_session', API_ID, API_HASH)

async def get_style_examples():
    """Сбор примеров постов для обучения модели стилю"""
    if REFERENCE_CHANNEL == '@my_channel_style' or not REFERENCE_CHANNEL:
        return "Стиль: Краткие новости, деловой стиль, использование эмодзи."

    try:
        entity = await client.get_entity(REFERENCE_CHANNEL)
        date_threshold = datetime.now(timezone.utc) - timedelta(days=30)
        examples = []
        
        async for message in client.iter_messages(entity, limit=20):
            if message.date < date_threshold:
                break
            if message.text and len(message.text) > 20:
                examples.append(message.text)
        
        if not examples:
            return "Стиль: Авторский блог, фокус на технологиях."

        context = "\n---\n".join(examples[:10])
        return f"Изучи стиль этих постов: {context}\nПерепиши новую новость в точно таком же стиле."
    except Exception as e:
        logging.warning(f"Не удалось получить стиль из {REFERENCE_CHANNEL}: {e}")
        return "Стиль: Современный Telegram-канал."

async def rewrite_text(text):
    """Генерация рерайта через Gemini"""
    try:
        style_instr = await get_style_examples()
        prompt = f"{style_instr}\n\nНОВОСТЬ:\n{text}\n\nНапиши только текст поста:"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logging.error(f"Ошибка Gemini API: {e}")
        return None

async def join_channels():
    """Вступление в каналы-доноры для активации мониторинга"""
    for channel in DONOR_CHANNELS:
        try:
            await client(functions.channels.JoinChannelRequest(channel))
            print(f"📡 Мониторинг активен: {channel}")
        except Exception as e:
            print(f"⚠️ Не удалось подключиться к {channel}: {e}")

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def handler(event):
    """Обработка новых постов из каналов-доноров"""
    if not event.text or len(event.text) < 15:
        return

    try:
        chat = await event.get_chat()
        source_title = getattr(chat, 'title', 'Источник')
        print(f"📥 Новое сообщение из {source_title}")
        
        rewritten = await rewrite_text(event.text)
        if rewritten:
            msg = f"📝 **ВАРИАНТ ПОСТА**\n\n{rewritten}\n\n---\n📡 Источник: {source_title}"
            await client.send_message(MY_ID, msg)
            print(f"🚀 Рерайт отправлен пользователю {MY_ID}")
    except Exception as e:
        logging.error(f"Ошибка в обработчике: {e}")

async def main():
    if not API_ID or not API_HASH:
        print("❌ ОШИБКА: API_ID или API_HASH не заданы в окружении!")
        return

    print("🛰 Запуск бота...")
    await client.start()
    
    try:
        await client.send_message(MY_ID, "✅ **Бот запущен.**\nИщу новые посты в каналах-донорах...")
    except:
        pass

    await join_channels()
    print("📡 Мониторинг каналов запущен. Ожидание сообщений...")
    await client.run_until_disconnected()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())

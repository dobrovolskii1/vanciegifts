
import os
import asyncio
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

# Загрузка переменных
load_dotenv()

# --- Конфигурация ---
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
MY_ID = 7991221711 

# Каналы
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']

# --- Инициализация клиентов ---
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

async def save_to_db(source: str, content: str):
    """Запись новости в Supabase"""
    try:
        data = {
            "source": source,
            "content": content,
            "created_at": "now()"
        }
        supabase.table("news").insert(data).execute()
        print(f"💾 Сохранено в БД от {source}")
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")

async def perform_rewrite(text):
    """Рерайт через Gemini"""
    prompt = f"Ты редактор TG-канала. Сделай краткий и яркий рерайт новости с эмодзи:\n\n{text}"
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ Ошибка Gemini: {e}")
        return None

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def message_handler(event):
    if not event.text or len(event.text) < 15:
        return

    chat = await event.get_chat()
    chat_name = getattr(chat, 'username', chat.title)
    print(f"📥 Новое сообщение из {chat_name}")

    rewritten = await perform_rewrite(event.text)
    if rewritten:
        # 1. Отправляем в личку
        try:
            await client.send_message(MY_ID, f"✨ **РЕРАЙТ**\n\n{rewritten}\n\n🔗 Источник: {chat_name}")
        except: pass
        
        # 2. Сохраняем в базу для Mini App
        await save_to_db(chat_name, rewritten)

async def start_bot():
    print("🛰 Бот запускается...")
    if not all([API_ID, API_HASH, SESSION_STRING, GEMINI_KEY, SUPABASE_URL, SUPABASE_KEY]):
        print("❌ ОШИБКА: Проверьте все ENV переменные!")
        return

    await client.start()
    print("✅ Бот онлайн и мониторит каналы.")
    await client.run_until_disconnected()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    asyncio.run(start_bot())

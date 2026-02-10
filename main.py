
import os
import asyncio
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from telethon.tl.functions.channels import JoinChannelRequest
import google.generativeai as genai
from supabase import create_client, Client
from dotenv import load_dotenv

# Загрузка .env
load_dotenv()

# --- Конфигурация ---
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
MY_ID = 7991221711 

# Каналы для мониторинга
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']

# --- Инициализация ---
genai.configure(api_key=GEMINI_KEY)
# Используем новейшую модель gemini-3-flash-preview
model = genai.GenerativeModel('gemini-3-flash-preview')

# Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Telethon
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

async def ensure_subscribed():
    """Проверяет подписку на все каналы-доноры"""
    print("🔄 Проверка подписок на каналы...")
    for channel in DONOR_CHANNELS:
        try:
            await client(JoinChannelRequest(channel))
            print(f"✅ Доступ к каналу подтвержден: {channel}")
        except Exception as e:
            print(f"⚠️ Ошибка доступа к {channel}: {e}")

async def save_to_db(source: str, content: str):
    """Безопасное сохранение в Supabase"""
    try:
        data = {"source": source, "content": content}
        supabase.table("news").insert(data).execute()
        print(f"💾 Сохранено в Mini App от {source}")
    except Exception as e:
        print(f"❌ Ошибка БД: {e}")

async def perform_rewrite(text):
    """Рерайт с использованием Gemini"""
    prompt = (
        f"Ты — автор популярного IT-канала. Сделай рерайт этой новости. "
        f"Стиль: кратко, дерзко, только суть, 2-3 эмодзи. "
        f"Удали любые упоминания чужих каналов и ссылок. \n\nТекст:\n{text}"
    )
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"❌ Ошибка Gemini: {e}")
        return None

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def message_handler(event):
    if not event.text or len(event.text) < 25:
        return

    try:
        chat = await event.get_chat()
        source_name = getattr(chat, 'username', 'Channel')
    except:
        source_name = "Source"

    print(f"📥 Поймана новость из @{source_name}")

    rewritten = await perform_rewrite(event.text)
    
    if rewritten:
        # Отправка в ЛС
        try:
            await client.send_message(MY_ID, f"🆕 **ПРЕДЛОЖЕНИЕ ДЛЯ ПОСТА**\n\n{rewritten}\n\n🗳 _Опубликовать?_")
        except: pass
        
        # Запись в базу
        await save_to_db(source_name, rewritten)

async def main():
    print("🚀 Запуск AGENT PRO Worker...")
    
    if not all([API_ID, API_HASH, SESSION_STRING, GEMINI_KEY]):
        print("❌ ОШИБКА: Не все ENV переменные заполнены!")
        return

    await client.start()
    
    # Ключевой шаг: подписываемся на каналы, если еще не
    await ensure_subscribed()
    
    print("📡 Мониторинг запущен. Ожидаю новости...")
    await client.run_until_disconnected()

if __name__ == '__main__':
    logging.basicConfig(level=logging.ERROR)
    asyncio.run(main())

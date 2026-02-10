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
GEMINI_KEY = os.getenv('API_KEY', os.getenv('GEMINI_KEY', '')) # Ищем оба варианта
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
MY_ID = 7991221711 

# Каналы для мониторинга
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']

# --- Инициализация ИИ ---
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-3-flash-preview')
else:
    print("⚠️ ПРЕДУПРЕЖДЕНИЕ: Ключ GEMINI_KEY не найден.")

# Supabase
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("⚠️ ПРЕДУПРЕЖДЕНИЕ: Настройки Supabase отсутствуют.")

# Telethon
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

async def check_db_connection():
    """Проверка доступности таблицы"""
    try:
        supabase.table("news").select("id").limit(1).execute()
        print("✅ [DB] Подключение к таблице 'news' успешно.")
    except Exception as e:
        print(f"❌ [DB] Таблица 'news' не найдена или недоступна: {e}")
        print("💡 СОВЕТ: Создайте таблицу 'news' в Supabase SQL Editor.")

async def ensure_subscribed():
    """Автоматическая подписка на каналы"""
    print("🔄 [TELEGRAM] Проверка доступа к каналам...")
    for channel in DONOR_CHANNELS:
        try:
            await client(JoinChannelRequest(channel))
            print(f"✅ Доступ подтвержден: {channel}")
        except Exception as e:
            print(f"⚠️ Ошибка доступа к {channel}: {e}")

async def save_to_db(source: str, content: str):
    """Сохранение результата рерайта"""
    try:
        data = {"source": source, "content": content}
        supabase.table("news").insert(data).execute()
        print(f"💾 [SUCCESS] Пост сохранен в Mini App.")
    except Exception as e:
        print(f"❌ [DB ERROR] Ошибка сохранения: {e}")

async def perform_rewrite(text):
    """Рерайт с использованием Gemini 3 Flash"""
    prompt = (
        "Ты — топовый автор Telegram-канала. Твоя задача — переписать новость ниже. "
        "Требования: кратко, информативно, без воды, 2-3 эмодзи. "
        "ВАЖНО: удали любые ссылки на другие каналы, ботов и рекламу источников. "
        "Текст должен выглядеть как авторский пост твоего канала.\n\n"
        f"ТЕКСТ ДЛЯ ОБРАБОТКИ:\n{text}"
    )
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"❌ [AI ERROR] Ошибка генерации: {e}")
        return None

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def message_handler(event):
    # Игнорируем слишком короткие сообщения и пересылки (часто это реклама)
    if not event.text or len(event.text) < 30:
        return
    
    if event.fwd_from:
        print("⏭ [SKIP] Пропуск пересланного сообщения.")
        return

    # Простая фильтрация рекламных слов
    ads_keywords = ['подпишись', 'купить', 'реклама', 't.me/']
    count_ads = sum(1 for word in ads_keywords if word in event.text.lower())
    if count_ads > 2:
        print("⏭ [SKIP] Обнаружена высокая концентрация рекламных ссылок.")
        return

    try:
        chat = await event.get_chat()
        source_name = getattr(chat, 'username', 'Channel')
    except:
        source_name = "Source"

    print(f"📥 [NEW] Сообщение из @{source_name}. Начинаю рерайт...")

    rewritten = await perform_rewrite(event.text)
    
    if rewritten:
        # Отправка администратору для проверки
        try:
            await client.send_message(MY_ID, f"🚀 **ПРЕДЛОЖЕНИЕ ДЛЯ ПОСТА (от @{source_name})**\n\n{rewritten}")
        except: pass
        
        # Сохранение в базу данных для Mini App
        await save_to_db(source_name, rewritten)
    else:
        print(f"⚠️ [FAILED] Не удалось создать рерайт для поста из @{source_name}")

async def main():
    print("--- 🛠 AGENT PRO WORKER INITIALIZATION ---")
    
    if not all([API_ID, API_HASH, SESSION_STRING]):
        print("❌ КРИТИЧЕСКАЯ ОШИБКА: Проверьте API_ID, API_HASH и TELEGRAM_SESSION в Railway.")
        return

    try:
        await client.start()
        print("✅ [TELEGRAM] Авторизация успешна.")
        
        await check_db_connection()
        await ensure_subscribed()
        
        print("\n📡 [LIVE] Мониторинг запущен. Ожидаю новые посты...")
        await client.run_until_disconnected()
    except Exception as e:
        print(f"❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")

if __name__ == '__main__':
    logging.basicConfig(level=logging.ERROR)
    asyncio.run(main())

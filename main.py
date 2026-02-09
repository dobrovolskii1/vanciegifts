import os
import asyncio
import logging
from telethon import TelegramClient, events
from telethon.sessions import StringSession
import google.generativeai as genai
from dotenv import load_dotenv

# Загрузка .env для локальной разработки
load_dotenv()

# --- Настройка переменных окружения ---
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
BOT_TOKEN = os.getenv('BOT_TOKEN', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '')
MY_ID = 7991221711  # Ваш Telegram ID

# --- Конфигурация доноров ---
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']

# --- Инициализация Gemini ---
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

# --- Инициализация клиента Telethon ---
# Используется StringSession для обхода необходимости ввода кода при каждом запуске
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

async def perform_rewrite(text):
    """Отправка текста в Gemini для профессионального рерайта."""
    prompt = (
        "Ты — опытный редактор Telegram-каналов. Твоя задача — сделать качественный рерайт "
        "новости. Текст должен быть коротким, захватывающим, с использованием эмодзи и "
        "четкой структурой. Не добавляй отсебятины, только рерайт новости.\n\n"
        f"ТЕКСТ ДЛЯ РЕРАЙТА:\n{text}"
    )
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ Ошибка Gemini: {e}")
        return None

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def message_handler(event):
    """Слушатель новых сообщений в каналах-донорах."""
    if not event.text or len(event.text) < 10:
        return

    # Логирование
    chat = await event.get_chat()
    chat_name = getattr(chat, 'username', 'unknown')
    print(f"📥 Получено сообщение из @{chat_name}")

    # Рерайт
    rewritten_text = await perform_rewrite(event.text)
    
    if rewritten_text:
        try:
            # Отправка готового поста вам
            output_msg = (
                f"✨ **ГОТОВЫЙ РЕРАЙТ**\n\n"
                f"{rewritten_text}\n\n"
                f"--- \n"
                f"🔗 Источник: @{chat_name}"
            )
            await client.send_message(MY_ID, output_msg)
            print(f"🚀 Рерайт успешно отправлен пользователю {MY_ID}")
        except Exception as e:
            print(f"❌ Ошибка при отправке сообщения: {e}")

async def start_bot():
    print("🛰 Бот запускается...")
    
    # Проверка конфигурации
    if not all([API_ID, API_HASH, SESSION_STRING, GEMINI_KEY]):
        print("❌ ОШИБКА: Не все переменные окружения заданы (API_ID, API_HASH, TELEGRAM_SESSION, GEMINI_KEY)")
        return

    try:
        await client.start()
        print("✅ Авторизация в Telegram выполнена!")
        print(f"📡 Мониторинг каналов: {', '.join(DONOR_CHANNELS)}")
        
        # Уведомление о запуске
        await client.send_message(MY_ID, "🟢 Бот успешно запущен на Railway и готов к работе!")
    except Exception as e:
        print(f"❌ Критическая ошибка при старте: {e}")
        return

    await client.run_until_disconnected()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    try:
        asyncio.run(start_bot())
    except KeyboardInterrupt:
        print("🛑 Бот остановлен вручную.")


import os
import asyncio
import logging
from telethon import TelegramClient, events
import google.generativeai as genai
from dotenv import load_dotenv

# Загрузка переменных окружения (для локальной разработки, на Railway подтянутся сами)
load_dotenv()

# --- Конфигурация ---
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
BOT_TOKEN = os.getenv('BOT_TOKEN', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
MY_ID = 7991221711  # Ваш Telegram ID

# Список доноров (строго с @ как просили)
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']

# Настройка Gemini
genai.configure(api_key=GEMINI_KEY)
# Используем gemini-3-pro-preview для качественного рерайта
model = genai.GenerativeModel('gemini-3-pro-preview')

# Инициализация клиента Telethon (используем сессию 'my_session')
client = TelegramClient('my_session', API_ID, API_HASH)

# Инструкция для ИИ (системный промпт)
# В реальной версии здесь можно подтягивать посты из вашего эталонного канала для обучения
SYSTEM_INSTRUCTION = """
Ты — профессиональный редактор Telegram-каналов. 
Твоя задача: взять текст новости и переписать его, сохраняя смысл, но адаптируя под стиль 'авторского блога'. 
Используй короткие предложения, активные глаголы и умеренное количество эмодзи. 
Не добавляй отсебятины, только рерайт предоставленного контента.
"""

async def rewrite_text(text):
    try:
        prompt = f"{SYSTEM_INSTRUCTION}\n\nВот текст для рерайта:\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ Ошибка Gemini: {e}")
        return None

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def handler(event):
    # Логирование как заказывали
    print(f"📩 Получено сообщение из: {event.chat.username if event.chat.username else event.chat.title}")
    
    if not event.text or len(event.text) < 10:
        return

    # Отправляем текст на рерайт
    rewritten = await rewrite_text(event.text)
    
    if rewritten:
        # Формируем сообщение для утверждения
        source_link = f"https://t.me/{event.chat.username}/{event.id}" if event.chat.username else "в закрытом канале"
        
        preview_message = (
            f"🔔 **Новый пост на утверждение!**\n\n"
            f"📝 **Рерайт:**\n{rewritten}\n\n"
            f"🔗 [Оригинальный пост]({source_link})\n"
            f"👤 Источник: @{event.chat.username}"
        )
        
        # Шлем именно вам (MY_ID)
        await client.send_message(MY_ID, preview_message, link_preview=False)
        print(f"✅ Готовый пост отправлен пользователю {MY_ID}")

async def main():
    print("🚀 Бот запускается...")
    # Авторизация (на Railway важно иметь файл сессии или использовать StringSession)
    await client.start()
    print("🤖 Мониторинг каналов запущен. Ожидание сообщений...")
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())

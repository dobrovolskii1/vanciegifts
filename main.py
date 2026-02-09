import os
import asyncio
from telethon import TelegramClient, events
from telethon.sessions import StringSession
import google.generativeai as genai

# --- ДАННЫЕ ИЗ RAILWAY ---
API_ID = int(os.getenv('API_ID', '0'))
API_HASH = os.getenv('API_HASH', '')
BOT_TOKEN = os.getenv('BOT_TOKEN', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '') # Наша новая секретная строка

# --- НАСТРОЙКИ ---
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']
MY_ID = 7991221711 

# Настройка ИИ
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# --- ЗАПУСК ЧЕРЕЗ STRING SESSION ---
# Теперь боту не нужен файл .session, он берет всё из памяти сервера
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)

@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def handler(event):
    chat = await event.get_chat()
    chat_username = getattr(chat, 'username', 'unknown')
    print(f"📩 Поймал пост из: @{chat_username}")

    original_text = event.message.message
    if not original_text or len(original_text) < 5: return
    
    try:
        prompt = f"Перепиши этот текст в крутом современном стиле для Телеграм-канала, используй эмодзи: {original_text}"
        response = model.generate_content(prompt)
        await client.send_message(MY_ID, f"🆕 **Рерайт из @{chat_username}:**\n\n{response.text}")
        print(f"✅ Готово!")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

@client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def test_handler(event):
    if event.sender_id == MY_ID:
        await event.respond("🤖 Сессия активна! Я в облаке и всё слышу.")

async def main():
    print("🚀 Запуск облачной String-сессии...")
    await client.start()
    print(f"✅ Бот запущен! Слежу за: {', '.join(DONOR_CHANNELS)}")
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())

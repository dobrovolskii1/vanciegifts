import os
import asyncio
from telethon import TelegramClient, events
import google.generativeai as genai

# --- ТЕПЕРЬ БОТ БЕРЕТ КЛЮЧИ ИЗ НАСТРОЕК СЕРВЕРА (БЕЗОПАСНО) ---
API_ID = int(os.getenv('API_ID', '36953860'))
API_HASH = os.getenv('API_HASH', 'ebaa47462ab8c0c78a637d062a25a01b')
BOT_TOKEN = os.getenv('BOT_TOKEN')
GEMINI_KEY = os.getenv('GEMINI_KEY')

# Список каналов-доноров (теперь он в коде, позже свяжем с сайтом)
DONOR_CHANNELS = ['giftnews', 'gift_newstg', 'digest']
# Твой ID, чтобы бот присылал готовые посты именно тебе
MY_ID = 7991221711 

# Настройка ИИ
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Создаем клиента
client = TelegramClient('my_session', API_ID, API_HASH)

# 1. ОБРАБОТЧИК НОВЫХ ПОСТОВ В КАНАЛАХ
@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def handler(event):
    original_text = event.message.message
    if not original_text or len(original_text) < 10: return
    
    print(f"📡 Поймал пост в {event.chat.username}...")
    
    try:
        prompt = f"Перепиши этот текст в крутом современном стиле для Телеграм-канала, используй эмодзи: {original_text}"
        response = model.generate_content(prompt)
        
        # Отправляем готовый рерайт тебе в личку
        await client.send_message(MY_ID, f"🆕 **Готовый пост из @{event.chat.username}:**\n\n{response.text}")
        print("✅ Рерайт отправлен тебе в личку!")
    except Exception as e:
        print(f"❌ Ошибка Gemini: {e}")

# 2. ТЕСТОВЫЙ ОБРАБОТЧИК (ОТВЕТ В ЛИЧКУ БОТА)
@client.on(events.NewMessage(incoming=True))
async def test_handler(event):
    if event.is_private and event.sender_id == MY_ID:
        await event.respond("🤖 Я слежу за каналами! Как только там выйдет пост, я пришлю тебе рерайт сюда.")

async def main():
    print("🚀 Запуск облачной сессии Telegram...")
    await client.start()
    print("✅ Бот на автопилоте! Слежу за: " + ", ".join(DONOR_CHANNELS))
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
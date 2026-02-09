import os
import asyncio
from telethon import TelegramClient, events
import google.generativeai as genai

# --- БЕЗОПАСНОЕ ПОДКЛЮЧЕНИЕ КЛЮЧЕЙ ИЗ RAILWAY ---
# Теперь в коде нет реальных ключей, они подтянутся из настроек сервера
API_ID = int(os.getenv('API_ID', '0'))
API_HASH = os.getenv('API_HASH', '')
BOT_TOKEN = os.getenv('BOT_TOKEN', '')
GEMINI_KEY = os.getenv('GEMINI_KEY', '')

# --- НАСТРОЙКИ КАНАЛОВ И ПОЛЬЗОВАТЕЛЯ ---
# Добавили @ для стабильной работы Telethon
DONOR_CHANNELS = ['@giftnews', '@gift_newstg', '@digest', '@UaOnlii']
MY_ID = 7991221711  # Твой ID, куда будут приходить рерайты

# Настройка ИИ Gemini
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Создаем клиента, используя файл сессии
client = TelegramClient('my_session', API_ID, API_HASH)

# --- ОБРАБОТЧИК СООБЩЕНИЙ ---
@client.on(events.NewMessage(chats=DONOR_CHANNELS))
async def handler(event):
    # Логируем в Railway, чтобы видеть, что пост пойман
    chat = await event.get_chat()
    chat_username = getattr(chat, 'username', 'unknown')
    print(f"📩 Поймал пост из канала: @{chat_username}")

    original_text = event.message.message
    if not original_text or len(original_text) < 5:
        return
    
    try:
        # Формируем задание для ИИ
        prompt = f"Перепиши этот текст в крутом современном стиле для Телеграм-канала, используй эмодзи: {original_text}"
        response = model.generate_content(prompt)
        
        # Отправляем готовый рерайт тебе в личку
        await client.send_message(MY_ID, f"🆕 **Рерайт поста из @{chat_username}:**\n\n{response.text}")
        print(f"✅ Успешно отправил рерайт в личку!")
        
    except Exception as e:
        print(f"❌ Ошибка при обработке: {e}")

# Тестовая функция: отвечает тебе, если ты напишешь боту лично
@client.on(events.NewMessage(incoming=True, func=lambda e: e.is_private))
async def test_handler(event):
    if event.sender_id == MY_ID:
        await event.respond("🤖 Связь установлена! Я слежу за каналами и пришлю рерайт, как только там что-то появится.")
        print("📨 Ответил на тестовое сообщение в личке.")

async def main():
    print("🚀 Запуск облачной сессии Telegram...")
    await client.start()
    print(f"✅ Бот активен! Слежу за: {', '.join(DONOR_CHANNELS)}")
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())

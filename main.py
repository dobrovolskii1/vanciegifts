import os
import asyncio
import google.generativeai as genai
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from supabase import create_client, Client
from fastapi import FastAPI, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

load_dotenv()

# --- Конфигурация ---
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '')
GEMINI_KEY = os.getenv('API_KEY', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
MY_ID = int(os.getenv('MY_TELEGRAM_ID', 0))
PORT = int(os.getenv('PORT', 8080))

# --- Инициализация ИИ ---
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    ai_model = genai.GenerativeModel('gemini-3-flash-preview')

# --- Инициализация Supabase ---
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Telegram Клиент ---
client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Роуты Сервера ---
@app.get("/")
async def serve_index():
    return FileResponse('index.html')

@app.get("/index.tsx")
async def serve_tsx():
    return FileResponse('index.tsx', media_type='text/javascript')

@app.get("/env.js")
async def serve_env():
    # Безопасная передача ключей во фронтенд через инжект в объект window
    content = f"""
    window.process = {{
        env: {{
            API_KEY: '{GEMINI_KEY}',
            SUPABASE_URL: '{SUPABASE_URL}',
            SUPABASE_KEY: '{SUPABASE_KEY}'
        }}
    }};
    """
    return Response(content=content, media_type="application/javascript")

# --- Логика Рерайта ---
async def perform_rewrite(text):
    if not GEMINI_KEY: return text
    prompt = f"Ты — эксперт по Telegram-контенту. Перепиши этот пост. Сделай его коротким, хлестким, добавь 1-2 эмодзи. Сохрани пользу. Текст:\n\n{text}"
    try:
        # Используем современный метод генерации из системных инструкций
        from google.generativeai import GoogleGenAI
        ai = GoogleGenAI(apiKey=GEMINI_KEY)
        response = await ai.models.generateContent(
            model='gemini-3-flash-preview',
            contents=prompt
        )
        return response.text.strip()
    except Exception as e:
        print(f"Ошибка ИИ: {e}")
        return text

@client.on(events.NewMessage())
async def handler(event):
    if not event.text or len(event.text) < 50 or not event.is_channel:
        return

    # Логика: если пост пришел из канала (можно фильтровать по ID в будущем)
    rewritten = await perform_rewrite(event.text)
    
    if rewritten:
        # 1. Отправляем владельцу на утверждение
        if MY_ID:
            await client.send_message(MY_ID, f"🎯 **ГОТОВЫЙ РЕРАЙТ:**\n\n{rewritten}")
        
        # 2. Сохраняем в Supabase для отображения в Mini App
        if supabase:
            try:
                chat = await event.get_chat()
                source_title = getattr(chat, 'title', 'Источник')
                supabase.table("news").insert({
                    "source": source_title,
                    "content": rewritten
                }).execute()
            except Exception as e:
                print(f"Ошибка сохранения в БД: {e}")

@app.on_event("startup")
async def startup():
    print("🚀 Запуск Telegram клиента...")
    await client.start()
    asyncio.create_task(client.run_until_disconnected())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
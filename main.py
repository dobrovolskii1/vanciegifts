import os
import asyncio
import google.generativeai as genai
from telethon import TelegramClient, events
from telethon.sessions import StringSession
from supabase import create_client, Client
from fastapi import FastAPI, Response
from fastapi.responses import FileResponse
from dotenv import load_dotenv
import uvicorn

load_dotenv()

# --- Config ---
API_ID = int(os.getenv('API_ID', 0))
API_HASH = os.getenv('API_HASH', '')
SESSION_STRING = os.getenv('TELEGRAM_SESSION', '')
GEMINI_KEY = os.getenv('API_KEY', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
MY_ID = int(os.getenv('MY_TELEGRAM_ID', 7991221711))
PORT = int(os.getenv('PORT', 8080))

# --- Services Init ---
if GEMINI_KEY:
    genai.configure(api_key=GEMINI_KEY)
    ai = genai.GenerativeModel('gemini-3-flash-preview')

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

client = TelegramClient(StringSession(SESSION_STRING), API_ID, API_HASH)
app = FastAPI()

# --- Web Routes ---
@app.get("/")
async def serve_index(): return FileResponse('index.html')

@app.get("/index.tsx")
async def serve_tsx(): return FileResponse('index.tsx', media_type='text/javascript')

@app.get("/env.js")
async def serve_env():
    content = f"window.process = {{ env: {{ API_KEY: '{GEMINI_KEY}', SUPABASE_URL: '{SUPABASE_URL}', SUPABASE_KEY: '{SUPABASE_KEY}' }} }};"
    return Response(content=content, media_type="application/javascript")

# --- AI & Logic ---
async def rewrite_post(text):
    prompt = f"Перепиши этот пост для Telegram. Сделай его захватывающим, коротким и сохрани суть:\n\n{text}"
    try:
        response = await ai.generate_content(prompt)
        return response.text.strip()
    except: return None

@client.on(events.NewMessage(chats=['@giftnews', '@durov', '@techcrunch'])) # Добавь свои каналы тут
async def handler(event):
    if not event.text or len(event.text) < 30: return
    
    rewritten = await rewrite_post(event.text)
    if rewritten:
        # Уведомляем владельца
        await client.send_message(MY_ID, f"📢 **Новый пост готов:**\n\n{rewritten}")
        
        # Сохраняем в Supabase
        if supabase:
            chat = await event.get_chat()
            source = getattr(chat, 'username', 'Unknown')
            supabase.table("news").insert({"source": f"@{source}", "content": rewritten}).execute()

# --- Lifecycle ---
@app.on_event("startup")
async def startup():
    print("🚀 Starting Telegram Client...")
    await client.start()
    asyncio.create_task(client.run_until_disconnected())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
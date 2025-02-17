from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import logging

# Initialize FastAPI app
app = FastAPI()

# Configure CORS (for frontend integration later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Ollama API endpoint (running locally)
OLLAMA_URL = "http://localhost:11434/api/generate"

# Enable logging
logging.basicConfig(level=logging.INFO)

# Define a request model
class ChatRequest(BaseModel):
    prompt: str

# Root route (for testing)
@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}

# Chat endpoint with corrected request body parsing
@app.post("/chat/")
async def chat(request: ChatRequest):
    """Sends a prompt to the locally running Ollama LLaMA 2 model and returns the response."""

    payload = {
        "model": "deepseek-r1",  
        "prompt": request.prompt,
        "stream": False  # Change to True for streaming responses
    }

    try:
        logging.info(f"Sending request to Ollama: {request.prompt}")
        response = requests.post(OLLAMA_URL, json=payload)
        response.raise_for_status()  # Raise error if request fails

        response_data = response.json()
        return {"response": response_data.get("response", "No response from model")}

    except requests.exceptions.ConnectionError:
        logging.error("Failed to connect to Ollama. Is it running?")
        raise HTTPException(status_code=502, detail="Ollama is not running. Start Ollama first.")

    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

#curl -X POST "http://127.0.0.1:8000/chat/" -H "Content-Type: application/json" -d '{"prompt": "Hello, how are you?"}'


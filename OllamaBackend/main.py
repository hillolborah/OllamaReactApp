from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests
import logging

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Ollama API endpoint (running locally)
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_LIST_MODELS_URL = "http://localhost:11434/api/tags"  # URL to get list of models

# Enable logging
logging.basicConfig(level=logging.INFO)

# Define a request model
class ChatRequest(BaseModel):
    prompt: str
    model: str  # Added model selection

# Root route (for testing)
@app.get("/")
def read_root():
    return {"message": "FastAPI server is running!"}

# Endpoint to list installed models
@app.get("/models/")
def list_models():
    """Fetch installed Ollama models and return only model names."""
    try:
        response = requests.get(OLLAMA_LIST_MODELS_URL, timeout=5)
        response.raise_for_status()
        data = response.json()

        # ✅ Extract only model names
        if "models" in data and isinstance(data["models"], list):
            model_names = [model["name"] for model in data["models"] if "name" in model]
            return {"models": model_names}
        else:
            raise HTTPException(status_code=500, detail="Unexpected API response format")

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=502, detail="Ollama is not running. Start Ollama first.")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama API timed out.")
    except Exception as e:
        logging.error(f"Error fetching models: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve models")

# Streaming chat endpoint with dynamic model selection
@app.post("/chat/")
async def chat(request: ChatRequest):
    """Streams response from selected Ollama model in real-time."""

    payload = {
        "model": request.model,  # Use selected model
        "prompt": request.prompt,
        "stream": True  
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, stream=True)
        response.raise_for_status()

        def event_stream():
            """Generator function to stream model output."""
            for chunk in response.iter_lines():
                if chunk:
                    yield f"{chunk.decode('utf-8')}\n"

        return StreamingResponse(event_stream(), media_type="text/plain")

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=502, detail="Ollama is not running. Start Ollama first.")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
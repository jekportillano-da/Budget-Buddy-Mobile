"""
Minimal FastAPI test for Railway connectivity debugging
"""
from fastapi import FastAPI
import os

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "message": "Minimal FastAPI test working!",
        "port": os.getenv("PORT", "not_set"),
        "status": "success"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "minimal": True}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
"""
Minimal diagnostic FastAPI app for Railway
"""

from fastapi import FastAPI
import os

app = FastAPI(title="Railway Diagnostic")

@app.get("/")
async def root():
    return {
        "status": "working",
        "port": os.getenv("PORT", "not_set"),
        "environment": "railway"
    }

@app.get("/health")
async def health():
    return {"health": "ok"}
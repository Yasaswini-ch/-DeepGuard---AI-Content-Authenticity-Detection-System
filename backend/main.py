from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.detector import DetectionService
from services.robustness import RobustnessService
from services.image_detector import ImageDetectionService
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="DeepGuard API", description="AI Content Detection System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = DetectionService()
robustness = RobustnessService()
image_detector = ImageDetectionService()

class DetectionRequest(BaseModel):
    text: str

class PerturbationResponse(BaseModel):
    perturbed_text: str

@app.get("/")
async def root():
    return {"message": "DeepGuard API is running"}

@app.post("/api/robustness/perturb", response_model=PerturbationResponse)
async def perturb_text(request: DetectionRequest):
    try:
        perturbed = await robustness.perturb_text(request.text)
        return {"perturbed_text": perturbed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/detect/image")
async def detect_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = await image_detector.analyze_image(contents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DetectionResponse(BaseModel):
    probability_ai: float
    status: str
    likely_source: str
    confidence_score: float
    perplexity: float
    burstiness: float
    explanation: str
    disclaimer: str
    language: str
    language_warning: str
    highlights: List[dict]
    engines: List[dict]

@app.get("/")
async def root():
    return {"message": "DeepGuard API is running"}

@app.post("/api/detect/text", response_model=DetectionResponse)
async def detect_text(request: DetectionRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        result = await detector.analyze_text(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

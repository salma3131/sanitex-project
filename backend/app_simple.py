from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Placeholder for NLP model
def analyze_sentiment(text):
    # Simple placeholder sentiment analysis
    if "bad" in text.lower() or "broken" in text.lower() or "dirty" in text.lower():
        return {"label": "NEGATIVE", "score": 0.8}
    return {"label": "POSITIVE", "score": 0.6}

# Placeholder for CV model
def analyze_image(image_path):
    # Placeholder: return severity based on filename or random
    return "High severity"

@app.post("/report-issue")
async def report_issue(
    text: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(None)
):
    # Process text with simple analysis
    sentiment = analyze_sentiment(text)

    # Process image if provided
    severity = "Low"
    if image:
        # Save image temporarily
        with open("temp.jpg", "wb") as f:
            f.write(await image.read())
        severity = analyze_image("temp.jpg")
        os.remove("temp.jpg")

    # Simple location placeholder
    address = f"Location: {latitude}, {longitude}"

    return {
        "message": "Issue reported",
        "sentiment": sentiment,
        "severity": severity,
        "location": address
    }

@app.get("/analytics")
async def get_analytics():
    # Placeholder for analytics
    return {
        "total_reports": 0,
        "high_severity": 0,
        "pending": 0,
        "in_progress": 0,
        "resolved": 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
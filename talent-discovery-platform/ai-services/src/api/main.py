from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import logging

from ..services.video_analyzer import VideoAnalyzer
from ..services.comment_analyzer import CommentAnalyzer
from ..services.talent_classifier import TalentClassifier

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TalentVault AI Services",
    description="AI-powered talent analysis and scoring services",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
video_analyzer = VideoAnalyzer()
comment_analyzer = CommentAnalyzer()
talent_classifier = TalentClassifier()


# Request/Response models
class VideoAnalysisRequest(BaseModel):
    videoId: str
    videoUrl: str
    duration: Optional[int] = None
    categoryId: Optional[str] = None


class VideoAnalysisResponse(BaseModel):
    performanceScore: float
    vocalScore: Optional[float] = None
    expressionScore: Optional[float] = None
    movementScore: Optional[float] = None
    timingScore: Optional[float] = None
    qualityScore: float
    categoryTags: List[str]


class CommentAnalysisRequest(BaseModel):
    commentId: str
    content: str


class CommentAnalysisResponse(BaseModel):
    sentimentScore: float
    isTroll: bool
    trollConfidence: float


class TalentClassificationRequest(BaseModel):
    videoUrl: str


class TalentClassificationResponse(BaseModel):
    categories: List[str]
    confidence: List[float]


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "video_analyzer": "ready",
            "comment_analyzer": "ready",
            "talent_classifier": "ready"
        }
    }


# Video analysis endpoint
@app.post("/analyze/video", response_model=VideoAnalysisResponse)
async def analyze_video(request: VideoAnalysisRequest):
    """
    Analyze a video for talent performance metrics.

    Returns scores for:
    - Overall performance
    - Vocal quality (for singers)
    - Facial expression/emotion
    - Movement/dance fluidity
    - Timing/delivery
    - Video quality
    - Auto-detected talent categories
    """
    try:
        logger.info(f"Analyzing video: {request.videoId}")

        result = await video_analyzer.analyze(
            video_url=request.videoUrl,
            duration=request.duration,
            category_id=request.categoryId
        )

        return VideoAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"Video analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Comment analysis endpoint
@app.post("/analyze/comment", response_model=CommentAnalysisResponse)
async def analyze_comment(request: CommentAnalysisRequest):
    """
    Analyze a comment for sentiment and troll detection.

    Returns:
    - Sentiment score (-1 to 1)
    - Troll detection flag
    - Troll confidence score
    """
    try:
        logger.info(f"Analyzing comment: {request.commentId}")

        result = await comment_analyzer.analyze(request.content)

        return CommentAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"Comment analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Talent classification endpoint
@app.post("/classify/talent", response_model=TalentClassificationResponse)
async def classify_talent(request: TalentClassificationRequest):
    """
    Classify the type of talent shown in a video.

    Categories: singer, actor, dancer, comedian, voice-over, musician, other
    """
    try:
        result = await talent_classifier.classify(request.videoUrl)

        return TalentClassificationResponse(**result)

    except Exception as e:
        logger.error(f"Talent classification failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# Batch analysis endpoint
@app.post("/analyze/batch")
async def analyze_batch(
    video_ids: List[str],
    background_tasks: BackgroundTasks
):
    """
    Queue multiple videos for background analysis.
    """
    for video_id in video_ids:
        background_tasks.add_task(video_analyzer.queue_analysis, video_id)

    return {"message": f"Queued {len(video_ids)} videos for analysis"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)

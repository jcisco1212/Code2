import logging
from typing import Dict
import re

logger = logging.getLogger(__name__)

# Troll detection patterns
TROLL_PATTERNS = [
    r'\b(hate|stupid|ugly|trash|garbage|worst|terrible|suck|loser|pathetic)\b',
    r'\b(kill yourself|kys|die|cancer)\b',
    r'[A-Z]{5,}',  # Excessive caps
    r'(.)\1{4,}',  # Repeated characters
    r'[!?]{3,}',   # Excessive punctuation
]

# Positive words for sentiment
POSITIVE_WORDS = [
    'amazing', 'awesome', 'beautiful', 'brilliant', 'excellent', 'fantastic',
    'great', 'incredible', 'love', 'perfect', 'talented', 'wonderful', 'best',
    'inspiring', 'impressive', 'outstanding', 'superb', 'fire', 'goat'
]

# Negative words for sentiment
NEGATIVE_WORDS = [
    'bad', 'boring', 'disappointing', 'hate', 'horrible', 'mediocre', 'poor',
    'terrible', 'trash', 'ugly', 'untalented', 'weak', 'worst', 'cringe'
]


class CommentAnalyzer:
    """
    AI-powered comment analysis for sentiment and troll detection.

    In production, this would use:
    - BERT-based sentiment models
    - Fine-tuned toxicity detection models
    - Perspective API integration
    """

    def __init__(self):
        self.initialized = True
        logger.info("CommentAnalyzer initialized")

    async def analyze(self, content: str) -> Dict:
        """
        Analyze a comment for sentiment and troll detection.

        Returns:
        - sentimentScore: -1 (negative) to 1 (positive)
        - isTroll: Boolean flag for potential troll comment
        - trollConfidence: 0-1 confidence score for troll detection
        """
        try:
            content_lower = content.lower()

            # Calculate sentiment
            sentiment_score = self._calculate_sentiment(content_lower)

            # Check for troll patterns
            is_troll, troll_confidence = self._detect_troll(content)

            return {
                "sentimentScore": round(sentiment_score, 3),
                "isTroll": is_troll,
                "trollConfidence": round(troll_confidence, 3)
            }

        except Exception as e:
            logger.error(f"Comment analysis error: {str(e)}")
            raise

    def _calculate_sentiment(self, content: str) -> float:
        """
        Calculate sentiment score using keyword matching.

        In production, would use VADER or BERT-based models.
        """
        words = content.split()
        positive_count = sum(1 for word in words if word in POSITIVE_WORDS)
        negative_count = sum(1 for word in words if word in NEGATIVE_WORDS)

        total = positive_count + negative_count
        if total == 0:
            return 0.0

        # Score from -1 to 1
        score = (positive_count - negative_count) / max(total, 1)
        return max(-1, min(1, score))

    def _detect_troll(self, content: str) -> tuple:
        """
        Detect potential troll comments using pattern matching.

        In production, would use ML-based toxicity detection.
        """
        troll_score = 0.0

        # Check troll patterns
        for pattern in TROLL_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                troll_score += 0.3

        # Check message length (very short aggressive messages are suspicious)
        if len(content) < 20 and any(word in content.lower() for word in NEGATIVE_WORDS[:5]):
            troll_score += 0.2

        # Normalize score
        troll_score = min(1.0, troll_score)

        return troll_score > 0.5, troll_score

    async def batch_analyze(self, comments: list) -> list:
        """Analyze multiple comments at once."""
        results = []
        for comment in comments:
            result = await self.analyze(comment['content'])
            result['commentId'] = comment.get('id')
            results.append(result)
        return results

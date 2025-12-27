import logging
from typing import Dict, Tuple
import re
import os

logger = logging.getLogger(__name__)

# Try to import VADER sentiment analyzer
try:
    from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
    vader_analyzer = SentimentIntensityAnalyzer()
    VADER_AVAILABLE = True
    logger.info("VADER sentiment analyzer loaded successfully")
except ImportError:
    VADER_AVAILABLE = False
    logger.warning("VADER not available, using fallback sentiment analysis")

# Try to import transformers for advanced toxicity detection
try:
    from transformers import pipeline
    # Load a toxicity detection model
    toxicity_classifier = None  # Will be loaded on first use
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    toxicity_classifier = None

# Troll detection patterns (for fallback)
TROLL_PATTERNS = [
    (r'\b(hate|stupid|ugly|trash|garbage|worst|terrible|suck|loser|pathetic)\b', 0.2),
    (r'\b(kill yourself|kys|die|cancer|retard)\b', 0.8),
    (r'\b(f+u+c+k|sh+i+t|a+ss+hole|b+i+t+c+h)\b', 0.4),
    (r'[A-Z]{5,}', 0.15),  # Excessive caps
    (r'(.)\1{4,}', 0.1),  # Repeated characters
    (r'[!?]{4,}', 0.1),   # Excessive punctuation
    (r'(spam|scam|fake|fraud)', 0.3),
]

# Harassment indicators
HARASSMENT_PATTERNS = [
    (r'\b(you are|you\'re|ur)\s+(ugly|stupid|dumb|trash|garbage|worthless)\b', 0.5),
    (r'\b(nobody|no one)\s+(cares|likes|wants)\b', 0.3),
    (r'\b(go away|get lost|shut up|stfu)\b', 0.3),
    (r'\b(cringe|mid|ratio|L\s*$|cope|seethe)\b', 0.15),
]


def get_toxicity_classifier():
    """Lazy load toxicity classifier to save memory."""
    global toxicity_classifier
    if TRANSFORMERS_AVAILABLE and toxicity_classifier is None:
        try:
            # Use a lightweight toxicity model
            toxicity_classifier = pipeline(
                "text-classification",
                model="martin-ha/toxic-comment-model",
                truncation=True,
                max_length=512
            )
            logger.info("Toxicity classifier loaded")
        except Exception as e:
            logger.warning(f"Could not load toxicity model: {e}")
    return toxicity_classifier


class CommentAnalyzer:
    """
    AI-powered comment analysis for sentiment and troll detection.
    Uses VADER for sentiment and pattern matching + ML for toxicity.
    """

    def __init__(self):
        self.initialized = True
        self.vader_enabled = VADER_AVAILABLE
        logger.info(f"CommentAnalyzer initialized (VADER: {VADER_AVAILABLE})")

    async def analyze(self, content: str) -> Dict:
        """
        Analyze a comment for sentiment and troll detection.

        Returns:
        - sentimentScore: -1 (negative) to 1 (positive)
        - isTroll: Boolean flag for potential troll/toxic comment
        - trollConfidence: 0-1 confidence score for troll detection
        """
        try:
            # Calculate sentiment
            sentiment_score = self._calculate_sentiment(content)

            # Check for toxic/troll content
            is_troll, troll_confidence = await self._detect_toxicity(content)

            # Adjust sentiment if toxic content detected
            if is_troll and sentiment_score > 0:
                sentiment_score = min(sentiment_score, 0)

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
        Calculate sentiment score using VADER.
        Returns score from -1 (most negative) to 1 (most positive).
        """
        if VADER_AVAILABLE:
            # VADER returns compound score from -1 to 1
            scores = vader_analyzer.polarity_scores(content)
            return scores['compound']
        else:
            # Fallback to simple keyword matching
            return self._fallback_sentiment(content)

    def _fallback_sentiment(self, content: str) -> float:
        """Simple keyword-based sentiment for fallback."""
        positive_words = [
            'amazing', 'awesome', 'beautiful', 'brilliant', 'excellent', 'fantastic',
            'great', 'incredible', 'love', 'perfect', 'talented', 'wonderful', 'best',
            'inspiring', 'impressive', 'outstanding', 'superb', 'fire', 'goat', 'legend',
            'nice', 'good', 'cool', 'sweet', 'dope', 'sick'
        ]
        negative_words = [
            'bad', 'boring', 'disappointing', 'hate', 'horrible', 'mediocre', 'poor',
            'terrible', 'trash', 'ugly', 'untalented', 'weak', 'worst', 'cringe', 'mid'
        ]

        content_lower = content.lower()
        words = re.findall(r'\b\w+\b', content_lower)

        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)

        total = positive_count + negative_count
        if total == 0:
            return 0.0

        score = (positive_count - negative_count) / max(len(words) / 5, 1)
        return max(-1, min(1, score))

    async def _detect_toxicity(self, content: str) -> Tuple[bool, float]:
        """
        Detect toxic/troll content using ML model and pattern matching.
        """
        toxicity_score = 0.0

        # Try ML-based detection first
        classifier = get_toxicity_classifier()
        if classifier:
            try:
                result = classifier(content[:512])[0]  # Truncate to max length
                if result['label'] == 'toxic':
                    toxicity_score = result['score']
                else:
                    toxicity_score = 1 - result['score']
            except Exception as e:
                logger.warning(f"ML toxicity detection failed: {e}")
                toxicity_score = self._pattern_based_toxicity(content)
        else:
            # Fallback to pattern matching
            toxicity_score = self._pattern_based_toxicity(content)

        # Determine if it's toxic based on threshold
        is_toxic = toxicity_score > 0.5

        return is_toxic, toxicity_score

    def _pattern_based_toxicity(self, content: str) -> float:
        """Pattern-based toxicity detection as fallback."""
        score = 0.0

        # Check troll patterns
        for pattern, weight in TROLL_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                score += weight

        # Check harassment patterns
        for pattern, weight in HARASSMENT_PATTERNS:
            if re.search(pattern, content, re.IGNORECASE):
                score += weight

        # Check message characteristics
        words = content.split()

        # Very short negative messages
        if len(words) <= 3:
            negative_short = any(re.search(p, content, re.I) for p, _ in TROLL_PATTERNS[:5])
            if negative_short:
                score += 0.2

        # Excessive emoji usage (often used sarcastically or to mock)
        emoji_count = len(re.findall(r'[\U0001F600-\U0001F64F]', content))
        if emoji_count > 5:
            score += 0.1

        return min(1.0, score)

    async def batch_analyze(self, comments: list) -> list:
        """Analyze multiple comments at once."""
        results = []
        for comment in comments:
            result = await self.analyze(comment['content'])
            result['commentId'] = comment.get('id')
            results.append(result)
        return results

    def get_sentiment_breakdown(self, content: str) -> Dict:
        """Get detailed sentiment breakdown for a comment."""
        if VADER_AVAILABLE:
            scores = vader_analyzer.polarity_scores(content)
            return {
                "positive": scores['pos'],
                "negative": scores['neg'],
                "neutral": scores['neu'],
                "compound": scores['compound']
            }
        return {
            "positive": 0,
            "negative": 0,
            "neutral": 1,
            "compound": 0
        }

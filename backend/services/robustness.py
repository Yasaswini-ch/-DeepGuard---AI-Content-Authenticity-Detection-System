import random
import nltk
from nltk.corpus import wordnet

# Ensure wordnet is downloaded
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')
    nltk.download('omw-1.4')

class RobustnessService:
    def __init__(self):
        pass

    async def perturb_text(self, text: str):
        words = text.split()
        perturbed_words = []
        
        # Simple heuristic: Replace ~10% of nouns/adjectives with synonyms
        for word in words:
            if len(word) > 4 and random.random() < 0.15:
                syns = wordnet.synsets(word)
                if syns:
                    # Get first synonym that isn't the word itself
                    synonyms = [l.name() for s in syns for l in s.lemmas() if l.name() != word]
                    if synonyms:
                        perturbed_words.append(random.choice(synonyms).replace('_', ' '))
                        continue
            perturbed_words.append(word)
            
        return " ".join(perturbed_words)

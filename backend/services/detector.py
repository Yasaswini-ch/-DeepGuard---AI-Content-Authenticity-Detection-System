import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification, GPT2LMHeadModel
import numpy as np
import nltk
from nltk.tokenize import sent_tokenize
from langdetect import detect, DetectorFactory

# Ensure reproducible results
DetectorFactory.seed = 0

# Download NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class DetectionService:
    def __init__(self):
        # Using a reliable RoBERTa detector for AI text
        self.detector_model_name = "Hello-SimpleAI/chatgpt-detector-roberta"
        self.tokenizer = AutoTokenizer.from_pretrained(self.detector_model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.detector_model_name)
        
        # Using GPT-2 for perplexity calculation
        self.perplexity_model_name = "gpt2"
        self.perp_tokenizer = AutoTokenizer.from_pretrained(self.perplexity_model_name)
        self.perp_model = GPT2LMHeadModel.from_pretrained(self.perplexity_model_name)
        
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model.to(self.device)
        self.perp_model.to(self.device)

    async def analyze_text(self, text: str):
        # 1. Language Detection
        try:
            language = detect(text)
        except:
            language = "unknown"
            
        lang_warning = ""
        if language != 'en' and language != 'unknown':
            lang_warning = f"Note: Detected language is '{language}'. Detection accuracy is highest for English text."

        # 2. RoBERTa Classification
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)
            # labels: 0 -> Human, 1 -> ChatGPT (AI)
            prob_ai = probs[0][1].item()
            
        # 3. Perplexity Calculation
        sentences = sent_tokenize(text)
        if not sentences:
            sentences = [text]
            
        perplexities = []
        for sent in sentences:
            if len(sent.strip()) < 5: continue
            
            encodings = self.perp_tokenizer(sent, return_tensors="pt").to(self.device)
            input_ids = encodings.input_ids
            target_ids = input_ids.clone()
            
            with torch.no_grad():
                outputs = self.perp_model(input_ids, labels=target_ids)
                neg_log_likelihood = outputs.loss
                perplexities.append(torch.exp(neg_log_likelihood).item())

        avg_perplexity = np.mean(perplexities) if perplexities else 0.0
        
        # 4. Burstiness Calculation (Standard Deviation of Perplexities)
        burstiness = np.std(perplexities) if len(perplexities) > 1 else 0.0

        # 5. Advanced Classification Logic
        status = "Inconclusive / AI-Assisted"
        if prob_ai > 0.75 and avg_perplexity < 40 and burstiness < 15:
            status = "Likely AI-Generated"
        elif prob_ai < 0.35 or (avg_perplexity > 60 and burstiness > 25):
            status = "Likely Human-Written"
        
        # 6. Model Attribution
        likely_source = self._identify_source(status, prob_ai, avg_perplexity, burstiness)
        
        # 7. Generate Explanation & Disclaimers
        explanation = self._generate_explanation(status, prob_ai, avg_perplexity, burstiness, likely_source, language)
        disclaimer = (
            "This system provides probabilistic analysis and is intended for decision-support only. "
            "Users should acknowledge that false positives can occur, particularly in formal, academic, "
            "or highly structured text which may naturally exhibit patterns similar to AI-generated content. "
            "Results should not be used as definitive proof of origin."
        )

        # 8. Highlights
        highlights = []
        for i, sent in enumerate(sentences):
            score = 0.5
            if i < len(perplexities):
                score = 1.0 - (min(perplexities[i], 80) / 80.0) 
            
            highlights.append({
                "text": sent,
                "score": score,
                "reason": "Predictable structure" if score > 0.7 else "Natural variance"
            })

        # 9. Comparison Engines
        engines = [
            {"name": "Transformer (RoBERTa)", "score": prob_ai * 100, "strength": "Contextual Nuance"},
            {"name": "Statistical (Perplexity)", "score": (100 - min(avg_perplexity * 2, 100)), "strength": "Predictability"},
            {"name": "Stylometric (Structural)", "score": (100 - min(burstiness * 3, 100)), "strength": "Burstiness"}
        ]

        return {
            "probability_ai": prob_ai,
            "status": status,
            "likely_source": likely_source,
            "confidence_score": max(prob_ai, 1 - prob_ai) if status != "Inconclusive / AI-Assisted" else 0.5,
            "perplexity": avg_perplexity,
            "burstiness": burstiness,
            "explanation": explanation,
            "disclaimer": disclaimer,
            "language": language,
            "language_warning": lang_warning,
            "highlights": highlights,
            "engines": engines
        }

    def _identify_source(self, status, prob_ai, perp, burst):
        if status != "Likely AI-Generated":
            return "Human Author"
        
        if perp < 15 and burst < 8:
            return "Legacy GPT-3.5 Style"
        elif perp < 30 and burst < 12:
            return "GPT-4 / Advanced Transformer"
        elif burst >= 12:
            return "Open-Source LLM (Llama/Mistral)"
        else:
            return "Generic AI Transformer"

    def _generate_explanation(self, status, prob_ai, perplexity, burstiness, source, language):
        factors = []
        if perplexity < 30:
            factors.append("very high linguistic predictability (low perplexity)")
        if burstiness < 10:
            factors.append("uniform sentence complexity (low burstiness)")
        if prob_ai > 0.8:
            factors.append("strong transformer architectural fingerprints")
            
        if status == "Likely AI-Generated":
            base = f"This content is flagged as {status} (Attributed to: {source}). "
        elif status == "Likely Human-Written":
            base = "This content shows high linguistic variance and unpredictable structural patterns typical of human authors. "
        else:
            base = "The analysis yielded mixed results. While some segments may show structural consistency, the overall linguistic signature does not align definitively with known AI models. "

        base += f"\n\nDetected Language: {language.upper()}. "
        if factors:
            base += f"Contributing factors include {', '.join(factors)}. "
        
        base += f"Metrics Summary: Perplexity is {perplexity:.2f}, Burstiness is {burstiness:.2f}. "
        return base

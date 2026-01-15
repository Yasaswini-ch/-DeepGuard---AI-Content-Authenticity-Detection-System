# DeepGuard - AI Content Authenticity & Detection System

DeepGuard is a state-of-the-art, multi-modal AI detection platform designed to verify the authenticity of digital content. It distinguishes between human-created and AI-generated text and images, providing detailed insights, explainability metrics, and robust analysis tools.

## 🚀 Key Features

### 🧠 Advanced Text Analysis
*   **Multi-Tier Classification**: Accurate detection of "Likely AI-Generated," "Inconclusive / AI-Assisted," or "Likely Human-Written" content.
*   **Deep Explainability**:
    *   **Perplexity & Burstiness**: Measures text complexity and sentence variation.
    *   **Highlighting**: Visualizes specific segments that exhibit AI patterns.
    *   **Multi-Model Comparison**: Cross-references results against Transformer, Statistical, and Stylometric engines.
*   **Model Attribution**: Identifies the likely source family (e.g., GPT-4, Llama, Legacy GPT-3.5).
*   **Adversarial Robustness Testing**: Built-in tool to slightly perturb text (synonym replacement) to test detection resilience.
*   **Multi-Lingual Support**: Automatically detects input language and warns about potential accuracy drops for non-English content.

### 🖼️ Deepfake Image Detection
*   **Vision Transformer (Swin-Tiny)**: Uses the `Smogy/SMOGY-Ai-images-detector` model to analyze image artifacts.
*   **Synthetic Probability**: precise scoring of "Real" vs "Deepfake/Synthetic" images.
*   **Supported Generators**: Optimized for Stable Diffusion XL, Midjourney v6, and DALL-E 3.

### 📊 Professional Reporting
*   **PDF Export**: Generate downloadable, professional-grade reports of analysis results.
*   **Visual Dashboard**: Interactive charts (Recharts) and glassmorphism UI for a premium user experience.

---

## 🛠️ Technology Stack

*   **Frontend**: React 18, Vite, Framer Motion (Animations), Recharts, Lucide React (Icons).
*   **Backend**: Python 3.9+, FastAPI, Uvicorn.
*   **AI/ML**: PyTorch, Hugging Face Transformers (`roberta-base-openai-detector`, `gpt2`, `Smogy/SMOGY-Ai-images-detector`), NLTK, SciPy.

---

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v16+)
*   Python (v3.9+)

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
py -m uvicorn main:app --port 8000 --reload
```

*The backend will start at `http://localhost:8000`. It will automatically download necessary models on the first run.*

### 2. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

*The frontend will be available at `http://localhost:5173`.*

---

## 💡 Usage

1.  **Text Analysis**:
    *   Paste text (articles, essays, etc.) into the "Text Analysis" tab.
    *   Click **Analyze Authenticity**.
    *   View the Verdict, Confidence Score, and detailed metrics (Perplexity, Burstiness).
    *   Use **Test Robustness** to see if paraphrasing the text fools the detector.

2.  **Image Analysis**:
    *   Switch to the "Image Analysis" tab.
    *   Upload an image file (JPG, PNG).
    *   Click **Analyze Authenticity** to check if it's a Deepfake.

3.  **Export**:
    *   Click the **Export Report** button to download a PDF summary of the findings.

---

## 🛡️ Ethical Disclaimer
DeepGuard provides probabilistic analysis for decision support. False positives can occur, especially with highly structured or formal writing. Results should not be used as the sole definitive proof of AI authorship or misconduct.

## 📄 License
MIT License.

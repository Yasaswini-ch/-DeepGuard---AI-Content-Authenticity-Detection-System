import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Shield, Search, AlertCircle, CheckCircle, BarChart3, Info, Cpu, Layers, FileDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = 'http://localhost:8000/api/detect/text';

function App() {
  const [mode, setMode] = useState('text'); // 'text' or 'image'
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [perturbing, setPerturbing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

  const handleDownloadPDF = async () => {
    if (!resultsRef.current || !result) return;

    const canvas = await html2canvas(resultsRef.current, {
      backgroundColor: '#020617',
      scale: 2,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`DeepGuard_Report_${new Date().getTime()}.pdf`);
  };

  const handleDetect = async () => {
    if (mode === 'text') {
      if (!text.trim()) return;
      setLoading(true);
      setResult(null);
      setError(null);
      try {
        const response = await axios.post(API_URL, { text });
        setResult(response.data);
      } catch (err) {
        setError('Failed to connect to detection backend. Please ensure the server is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      if (!file) return;
      setLoading(true);
      setResult(null);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post('http://localhost:8000/api/detect/image', formData);
        setResult(response.data);
      } catch (err) {
        setError('Failed to analyze image. Ensure the backend is running and the file is an image.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handlePerturb = async () => {
    if (!text.trim()) return;
    setPerturbing(true);
    try {
      const response = await axios.post('http://localhost:8000/api/robustness/perturb', { text });
      setText(response.data.perturbed_text);
    } catch (err) {
      console.error(err);
    } finally {
      setPerturbing(false);
    }
  };

  const chartData = result ? (
    mode === 'text' ? [
      { name: 'AI', value: result.probability_ai * 100 },
      { name: 'Human', value: (1 - result.probability_ai) * 100 }
    ] : [
      { name: 'Fake', value: result.probability_fake * 100 },
      { name: 'Real', value: (1 - result.probability_fake) * 100 }
    ]
  ) : [];

  const COLORS = ['#f43f5e', '#2dd4bf'];

  return (
    <div className="container">
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 className="gradient-text" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DeepGuard</h1>
        <p style={{ color: 'var(--text-muted)' }}>Multi-Modal AI Content Authenticity Verification Platform</p>
      </header>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className="btn"
          style={{
            background: mode === 'text' ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
            color: mode === 'text' ? 'white' : 'var(--text-main)',
            borderRadius: '30px',
            border: mode === 'text' ? 'none' : '1px solid var(--border)'
          }}
          onClick={() => { setMode('text'); setResult(null); }}
        >
          Text Analysis
        </button>
        <button
          className="btn"
          style={{
            background: mode === 'image' ? 'var(--primary)' : 'rgba(255,255,255,0.15)',
            color: mode === 'image' ? 'white' : 'var(--text-main)',
            borderRadius: '30px',
            border: mode === 'image' ? 'none' : '1px solid var(--border)'
          }}
          onClick={() => { setMode('image'); setResult(null); }}
        >
          Image Analysis
        </button>
      </div>

      <main className="grid">
        <section>
          <div className="glass card">
            <h3>{mode === 'text' ? 'Input Content' : 'Upload Image'}</h3>
            {mode === 'text' ? (
              <textarea
                className="input-area"
                placeholder="Paste article, essay, or assignment here (min 50 characters for better accuracy)..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            ) : (
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="image-upload"
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="image-upload"
                  className="glass"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem',
                    cursor: 'pointer',
                    border: '2px dashed var(--border)',
                    borderRadius: '12px'
                  }}
                >
                  {preview ? (
                    <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
                  ) : (
                    <>
                      <FileDown size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                      <p>Click or Drag Image to Upload</p>
                    </>
                  )}
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleDetect}
                disabled={loading || perturbing || (mode === 'text' ? text.length < 10 : !file)}
                style={{ flex: 2 }}
              >
                {loading ? (
                  <>Analyzing Architecture...</>
                ) : (
                  <><Search size={20} /> Analyze Authenticity</>
                )}
              </button>
              {mode === 'text' && (
                <button
                  className="btn"
                  onClick={handlePerturb}
                  disabled={loading || perturbing || text.length < 10}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-main)', border: '1px solid var(--border)' }}
                  title="Slightly perturb text with synonyms to test detection robustness"
                >
                  {perturbing ? 'Attacking...' : 'Test Robustness'}
                </button>
              )}
            </div>
            {mode === 'text' && result && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
                Tip: Try "Test Robustness" to see if slight modifications bypass detection.
              </p>
            )}
          </div>

          <AnimatePresence>
            {result && mode === 'text' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass card"
                style={{ marginTop: '2rem' }}
              >
                <h3>Analysis Breakdown</h3>
                <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  {result.highlights.map((h, i) => (
                    <span
                      key={i}
                      className={h.score > 0.7 ? 'highlight-ai' : 'highlight-human'}
                      title={h.reason}
                      style={{ padding: '2px 0' }}
                    >
                      {h.text}{' '}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {result && (
            <div className="glass card" style={{ marginTop: '2rem' }}>
              {mode === 'text' && (
                <div className="glass" style={{ padding: '1rem', marginBottom: '1.5rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Layers size={16} /> Multi-Model Comparison
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {result.engines.map((eng, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{eng.name}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: eng.score > 70 ? 'var(--danger)' : 'var(--accent)' }}>
                          {eng.score.toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '600' }}>{eng.strength}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="glass" style={{ padding: '1rem', border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Info size={16} /> Analysis Breakdown
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{result.explanation}</p>
              </div>
            </div>
          )}
        </section>

        <section>
          <div className="glass card" ref={resultsRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Detection Results</h3>
              {result && (
                <button
                  className="btn"
                  onClick={handleDownloadPDF}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--primary)', color: 'white' }}
                >
                  <FileDown size={14} /> Export Report
                </button>
              )}
            </div>
            {!result && !loading && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Info size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <p>Submit text to see analysis results.</p>
              </div>
            )}

            {loading && (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <Cpu size={48} className="spin" style={{ marginBottom: '1rem', color: "var(--primary)" }} />
                <p>Identifying Transformer Fingerprints...</p>
              </div>
            )}

            {result && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    color: (result.status === "Likely AI-Generated" || result.status === "Likely Synthetic / Deepfake") ? 'var(--danger)' :
                      (result.status === "Likely Human-Written" || result.status === "Likely Authentic Image") ? 'var(--accent)' : '#fbbf24'
                  }}>
                    {(result.status === "Likely AI-Generated" || result.status === "Likely Synthetic / Deepfake") ? <AlertCircle size={64} style={{ margin: '0 auto 1rem' }} /> :
                      (result.status === "Likely Human-Written" || result.status === "Likely Authentic Image") ? <CheckCircle size={64} style={{ margin: '0 auto 1rem' }} /> :
                        <Shield size={64} style={{ margin: '0 auto 1rem' }} />}
                    <h2 style={{ margin: 0 }}>{result.status}</h2>
                    {result.status === "Likely AI-Generated" && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: '500' }}>
                        Source: <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{result.likely_source}</span>
                      </div>
                    )}
                  </div>
                  {result.language_warning && (
                    <div style={{ margin: '1rem 0', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '8px', fontSize: '0.8rem', textAlign: 'center' }}>
                      <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
                      {result.language_warning}
                    </div>
                  )}
                  <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    Confidence: {(result.confidence_score * 100).toFixed(1)}%<br />
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      color: result.confidence_score > 0.85 ? 'var(--accent)' : result.confidence_score > 0.65 ? '#fbbf24' : 'var(--danger)'
                    }}>
                      {result.confidence_score > 0.85 ? 'High Confidence' :
                        result.confidence_score > 0.65 ? 'Moderate Confidence' :
                          'Low Confidence'}
                    </span>
                  </p>
                </div>

                <div style={{ height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <div className="metric-row">
                    <span className="metric-label"><BarChart3 size={14} /> {mode === 'text' ? 'Predictability (Perplexity)' : 'Synthetic Probability'}</span>
                    <span className="metric-value">{(mode === 'text' ? result.perplexity : result.probability_fake * 100).toFixed(2)}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${Math.min(mode === 'text' ? result.perplexity : result.probability_fake * 100, 100)}%` }}></div>
                  </div>

                  {mode === 'text' && (
                    <>
                      <div className="metric-row" style={{ marginTop: '0.75rem' }}>
                        <span className="metric-label"><Layers size={14} /> Irregularity (Burstiness)</span>
                        <span className="metric-value">{result.burstiness.toFixed(2)}</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.min(result.burstiness * 2, 100)}%`, background: '#c084fc' }}></div></div>
                    </>
                  )}

                  {mode === 'image' && (
                    <div className="metric-row" style={{ marginTop: '0.75rem' }}>
                      <span className="metric-label"><Layers size={14} /> Image Dimensions</span>
                      <span className="metric-value">{result.dimensions}</span>
                    </div>
                  )}
                </div>


                <div style={{ marginTop: '1rem', padding: '0.75rem', borderLeft: '3px solid #fbbf24', background: 'rgba(251, 191, 36, 0.05)', fontSize: '0.75rem', color: '#d1d5db' }}>
                  <strong>Ethical Disclaimer:</strong> {result.disclaimer}
                </div>
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--danger)', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginTop: '1rem' }}>
                <p>{error}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default App;

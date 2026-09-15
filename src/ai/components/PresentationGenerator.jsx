// src/ai/components/PresentationGenerator.jsx
// PPT Slide deck preview — generates and shows 5 structured slides

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, FileText, Check } from 'lucide-react';
import { generatePPTContent, exportToPPTX } from '../engine/pptEngine.js';

function SentimentDot({ sentiment }) {
  const colors = { positive: '#059669', neutral: '#64748B', negative: '#DC2626' };
  return (
    <span style={{
      display: 'inline-block',
      width: 7, height: 7, borderRadius: '50%',
      background: colors[sentiment] || colors.neutral,
      marginRight: 5,
      flexShrink: 0,
    }} />
  );
}

function renderBullet(text) {
  if (text === '---') return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part
  );
}

function SlideCard({ slide, isActive }) {
  if (!slide) return null;

  const typeColors = {
    executive: 'linear-gradient(135deg, #1e3a5f 0%, #2563EB 100%)',
    revenue:   'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)',
    risks:     'linear-gradient(135deg, #450a0a 0%, #991b1b 100%)',
    sales:     'linear-gradient(135deg, #2e1065 0%, #6d28d9 100%)',
    actions:   'linear-gradient(135deg, #052e16 0%, #166534 100%)',
  };
  const bgGradient = typeColors[slide.type] || typeColors.executive;

  return (
    <div style={{
      borderRadius: 12,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      background: 'var(--bg-card)',
    }}>
      {/* Slide header bar */}
      <div style={{
        background: bgGradient,
        padding: '14px 16px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>
            Slide {slide.id} of 5 · Crystal Ball Analytics
          </span>
          <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 700, letterSpacing: '0.06em' }}>ENTERPRISE BRIEFING</span>
        </div>
        <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px' }}>{slide.title}</h4>
        <p style={{ margin: '3px 0 0', fontSize: 10.5, opacity: 0.75 }}>{slide.subtitle}</p>
      </div>

      {/* KPI chips */}
      {slide.kpis && slide.kpis.length > 0 && (
        <div style={{ padding: '10px 14px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {slide.kpis.map((kpi, i) => (
            <div key={i} style={{
              flex: '1 1 calc(33.333% - 6px)',
              minWidth: 90,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--bg-muted)',
            }}>
              <div style={{ fontSize: 8.5, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{kpi.label}</div>
              <div style={{
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                color: kpi.sentiment === 'positive' ? '#059669' : kpi.sentiment === 'negative' ? '#DC2626' : 'var(--text-primary)',
              }}>
                {kpi.sentiment && <SentimentDot sentiment={kpi.sentiment} />}
                {kpi.value}
              </div>
              {kpi.sub && (
                <div style={{ fontSize: 8.5, color: 'var(--text-muted)', marginTop: 1 }}>{kpi.sub}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 2-Column Content Sections */}
      {slide.leftSection && slide.rightSection ? (
        <div style={{ padding: '12px 14px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {/* Left Container */}
          <div style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'rgba(37,99,235,0.06)',
              borderBottom: '1px solid var(--border)',
              padding: '6px 10px',
              fontSize: 9.5,
              fontWeight: 700,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {slide.leftSection.title}
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slide.leftSection.items.map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 5 }}>
                  <span style={{ color: '#2563EB', fontWeight: 700, flexShrink: 0 }}>•</span>
                  <span>{renderBullet(item)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Container */}
          <div style={{
            background: 'var(--bg-base)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'rgba(37,99,235,0.06)',
              borderBottom: '1px solid var(--border)',
              padding: '6px 10px',
              fontSize: 9.5,
              fontWeight: 700,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}>
              {slide.rightSection.title}
            </div>
            <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {slide.rightSection.items.map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: 5 }}>
                  <span style={{ color: '#2563EB', fontWeight: 700, flexShrink: 0 }}>•</span>
                  <span>{renderBullet(item)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Fallback single column */
        <div style={{ padding: '10px 14px 14px' }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {slide.bullets?.filter(Boolean).map((bullet, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {bullet !== '---' && (
                  <span style={{
                    flexShrink: 0,
                    marginTop: 4,
                    width: 4, height: 4,
                    borderRadius: '50%',
                    background: slide.type === 'risks' ? '#DC2626' : slide.type === 'actions' ? '#059669' : '#2563EB',
                  }} />
                )}
                <span>{renderBullet(bullet)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Slide footer note */}
      {slide.note && (
        <div style={{
          padding: '8px 14px 10px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: 9.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {slide.note}
          </span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600 }}>
            Slide {slide.id} of 5
          </span>
        </div>
      )}
    </div>
  );
}

export default function PresentationGenerator({ filters = {} }) {
  const [pptData, setPptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [exported, setExported] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFile, setExportedFile] = useState(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      try {
        setPptData(generatePPTContent(filters));
      } catch (e) {
        console.error('[PresentationGenerator]', e);
        setPptData(null);
      }
      setLoading(false);
    }, 700);
  }, []); // eslint-disable-line

  async function handleExport() {
    if (isExporting) return;
    setIsExporting(true);
    setExportedFile(null);
    try {
      const fileName = await exportToPPTX(filters);
      setExportedFile(fileName);
      setExported(true);
      setTimeout(() => setExported(false), 8000);
    } catch (e) {
      console.error('[PresentationGenerator] PPT export failed:', e);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid rgba(37,99,235,0.15)',
          borderTopColor: '#2563EB',
          animation: 'spin 1s linear infinite',
        }} />
        <span>Building presentation from analytics data...</span>
      </div>
    </div>
  );

  if (!pptData) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
      Unable to generate presentation.
    </div>
  );

  const slide = pptData.slides[currentSlide];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText style={{ width: 13, height: 13, color: '#2563EB' }} />
            AI Presentation
          </h3>
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Generated {pptData.generatedAt} · {pptData.totalAnomalies} issues detected
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          title="Download genuine Microsoft PowerPoint (.pptx) file"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8,
            border: exported ? '1px solid rgba(5,150,105,0.4)' : '1px solid rgba(37,99,235,0.3)',
            background: exported ? 'rgba(5,150,105,0.1)' : 'rgba(37,99,235,0.08)',
            color: exported ? '#059669' : '#2563EB',
            fontSize: 11.5, fontWeight: 600, cursor: isExporting ? 'wait' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {isExporting ? (
            <>
              <div style={{ width: 12, height: 12, border: '2px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Exporting .pptx...
            </>
          ) : exported ? (
            <>
              <Check style={{ width: 12, height: 12 }} />
              Downloaded .pptx
            </>
          ) : (
            <>
              <Download style={{ width: 12, height: 12 }} />
              Export PPT (.pptx)
            </>
          )}
        </button>
      </div>

      {/* Slide navigation dots */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        {pptData.slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              width: i === currentSlide ? 20 : 7,
              height: 7,
              borderRadius: 20,
              background: i === currentSlide ? '#2563EB' : 'var(--border)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Current slide */}
      <SlideCard slide={slide} isActive={true} />

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => setCurrentSlide(v => Math.max(0, v - 1))}
          disabled={currentSlide === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-muted)',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
            cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
            opacity: currentSlide === 0 ? 0.4 : 1,
          }}
        >
          <ChevronLeft style={{ width: 13, height: 13 }} />
          Previous
        </button>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
          {currentSlide + 1} / {pptData.slides.length}
        </span>
        <button
          onClick={() => setCurrentSlide(v => Math.min(pptData.slides.length - 1, v + 1))}
          disabled={currentSlide === pptData.slides.length - 1}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '6px 12px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--bg-muted)',
            color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600,
            cursor: currentSlide === pptData.slides.length - 1 ? 'not-allowed' : 'pointer',
            opacity: currentSlide === pptData.slides.length - 1 ? 0.4 : 1,
          }}
        >
          Next
          <ChevronRight style={{ width: 13, height: 13 }} />
        </button>
      </div>

      {/* Export note */}
      {exported && (
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.25)',
          fontSize: 11.5, color: '#059669', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'ai-fadeIn 0.2s ease',
        }}>
          <Check style={{ width: 14, height: 14, flexShrink: 0 }} />
          <span>
            Successfully generated and downloaded <strong>{exportedFile || 'Crystal_Ball_Executive_Briefing.pptx'}</strong>!
          </span>
        </div>
      )}
    </div>
  );
}

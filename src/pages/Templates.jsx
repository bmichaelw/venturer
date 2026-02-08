import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, Layers, Bookmark, Save, ArrowLeft, ChevronRight, Plus } from 'lucide-react';
import TemplateEditor from '../components/templates/TemplateEditor';
import TemplatePreview from '../components/templates/TemplatePreview';
import SaveAsTemplateModal from '../components/templates/SaveAsTemplateModal';

const categories = ["All", "marketing", "product", "operations", "sales", "other"];

const categoryColors = {
  marketing: "#b07a5b",
  product: "#805c5c",
  operations: "#5b8a72",
  sales: "#b07a5b",
  other: "#6b5b8a",
};

export default function TemplatesPage() {
  const [view, setView] = useState("browse");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: templates = [] } = useQuery({
    queryKey: ['projectTemplates'],
    queryFn: () => base44.entities.ProjectTemplate.list('-created_date'),
  });

  const filtered = templates.filter(t => {
    const matchCat = activeCategory === "All" || t.category === activeCategory;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const openPreview = (t) => {
    setSelectedTemplate(t);
    setView("preview");
  };

  return (
    <div style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(34,57,71,0.1); }
      `}</style>

      {/* BROWSE VIEW */}
      {view === "browse" && (
        <div className="fade-up">
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 800,
              fontSize: 28,
              color: "#223947",
              marginBottom: 4,
            }}>
              Project Templates
            </h1>
            <p style={{ fontSize: 14, color: "#805c5c", lineHeight: 1.5 }}>
              Jump-start your next project with a proven structure. Every task comes pre-loaded with STEP values.
            </p>
          </div>

          {/* Search + Save */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <div style={{
              flex: 1,
              minWidth: 240,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "white",
              border: "1px solid rgba(34,57,71,0.1)",
              borderRadius: 10,
              padding: "0 14px",
              height: 42,
            }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#805c5c" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 13,
                  color: "#323232",
                  width: "100%",
                }}
              />
            </div>
            <Button
              onClick={() => setShowEditor(true)}
              variant="outline"
              className="h-[42px]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
            <Button
              onClick={() => setShowSaveModal(true)}
              variant="outline"
              className="h-[42px]"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Project as Template
            </Button>
          </div>

          {/* Categories */}
          <div style={{ display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 16px",
                  borderRadius: 20,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  background: activeCategory === cat ? "#223947" : "white",
                  color: activeCategory === cat ? "#fffbf6" : "#805c5c",
                  boxShadow: activeCategory === cat ? "0 2px 8px rgba(34,57,71,0.2)" : "0 1px 3px rgba(0,0,0,0.05)",
                  textTransform: "capitalize",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template Grid */}
          {filtered.length === 0 ? (
            <div style={{
              background: "white",
              borderRadius: 14,
              padding: 48,
              textAlign: "center",
              border: "1px solid rgba(34,57,71,0.08)",
            }}>
              <Bookmark className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#223947", marginBottom: 8 }}>
                No templates yet
              </h3>
              <p style={{ fontSize: 14, color: "#805c5c", marginBottom: 20 }}>
                Create your first project template to get started
              </p>
              <Button onClick={() => setShowEditor(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: 16,
            }}>
              {filtered.map((t, i) => {
                const color = categoryColors[t.category] || "#223947";
                return (
                  <div
                    key={t.id}
                    className="card-hover fade-up"
                    style={{
                      background: "white",
                      borderRadius: 14,
                      padding: 24,
                      border: "1px solid rgba(34,57,71,0.08)",
                      cursor: "pointer",
                      animationDelay: `${i * 0.06}s`,
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onClick={() => openPreview(t)}
                  >
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: color,
                    }} />

                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: `${color}12`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Layers className="w-5 h-5" style={{ color }} />
                      </div>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: `${color}10`,
                        color: color,
                        textTransform: "capitalize",
                      }}>
                        {t.category}
                      </span>
                    </div>

                    <h3 style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: "#223947",
                      marginBottom: 6,
                    }}>
                      {t.name}
                    </h3>
                    <p style={{
                      fontSize: 12,
                      color: "#805c5c",
                      lineHeight: 1.5,
                      marginBottom: 16,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {t.description}
                    </p>

                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#999" }}>
                      {t.estimated_duration_days && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Clock className="w-3 h-3" /> {t.estimated_duration_days} days
                        </span>
                      )}
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 className="w-3 h-3" /> {t.tasks?.length || 0} tasks
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Layers className="w-3 h-3" /> {t.milestones?.length || 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PREVIEW VIEW */}
      {view === "preview" && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onBack={() => setView("browse")}
          onEdit={() => {
            setShowEditor(true);
            setView("browse");
          }}
        />
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onClose={() => {
            setShowEditor(false);
            setSelectedTemplate(null);
          }}
        />
      )}

      {/* Save As Template Modal */}
      {showSaveModal && (
        <SaveAsTemplateModal onClose={() => setShowSaveModal(false)} />
      )}
    </div>
  );
}
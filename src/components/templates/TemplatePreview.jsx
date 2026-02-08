import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, CheckCircle2, Layers, ChevronRight, Plus, Edit } from 'lucide-react';
import { createPageUrl } from '@/utils';

const StepBadge = ({ label, value, color }) => (
  <span style={{
    display: "inline-flex",
    alignItems: "center",
    gap: 3,
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 6,
    background: `${color}15`,
    color: color,
  }}>
    <span style={{ opacity: 0.6 }}>{label}</span>{value}
  </span>
);

export default function TemplatePreview({ template, onBack, onEdit }) {
  const [expandedMilestone, setExpandedMilestone] = useState(0);
  const navigate = useNavigate();
  const color = template.category === "marketing" ? "#b07a5b" :
    template.category === "product" ? "#805c5c" :
    template.category === "operations" ? "#5b8a72" :
    template.category === "sales" ? "#b07a5b" : "#6b5b8a";

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="fade-up">
      <button
        onClick={onBack}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
          color: "#805c5c",
          marginBottom: 24,
          padding: 0,
        }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to Templates
      </button>

      {/* Header Card */}
      <div style={{
        background: "white",
        borderRadius: 16,
        padding: 32,
        border: "1px solid rgba(34,57,71,0.08)",
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: color,
        }} />

        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${color}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Layers className="w-6 h-6" style={{ color }} />
              </div>
              <div>
                <h1 style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: 24,
                  color: "#223947",
                  lineHeight: 1.2,
                }}>
                  {template.name}
                </h1>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: color,
                  textTransform: "capitalize",
                }}>
                  {template.category}
                </span>
              </div>
            </div>
            <p style={{
              fontSize: 13,
              color: "#805c5c",
              lineHeight: 1.6,
              maxWidth: 520,
            }}>
              {template.description}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('Ventures'))}
              style={{
                background: "#223947",
                color: "#fffbf6",
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Use Template
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          gap: 24,
          marginTop: 20,
          paddingTop: 20,
          borderTop: "1px solid rgba(34,57,71,0.06)",
          flexWrap: "wrap",
        }}>
          {[
            {
              icon: Clock,
              label: "Duration",
              value: template.estimated_duration_days ? `${template.estimated_duration_days} days` : "N/A",
            },
            {
              icon: CheckCircle2,
              label: "Tasks",
              value: template.tasks?.length || 0,
            },
            {
              icon: Layers,
              label: "Milestones",
              value: template.milestones?.length || 0,
            },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <s.icon className="w-4 h-4" style={{ color: "#805c5c" }} />
              <div>
                <div style={{ fontSize: 10, color: "#999", fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 14, color: "#223947", fontWeight: 700 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      {template.milestones && template.milestones.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {template.milestones.map((m, mi) => (
            <div
              key={mi}
              style={{
                background: "white",
                borderRadius: 14,
                border: "1px solid rgba(34,57,71,0.08)",
                overflow: "hidden",
              }}
              className="fade-up"
            >
              <button
                onClick={() => setExpandedMilestone(expandedMilestone === mi ? null : mi)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "16px 20px",
                  border: "none",
                  cursor: "pointer",
                  background: expandedMilestone === mi ? `${color}08` : "transparent",
                  transition: "background 0.15s ease",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `${color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: color,
                  }}>
                    {mi + 1}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#223947",
                    }}>
                      {m.title}
                    </div>
                    <div style={{ fontSize: 11, color: "#999", fontWeight: 500 }}>
                      {m.description && `${m.description} · `}
                      {m.days_offset ? `Day ${m.days_offset}` : 'Start'}
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className="w-4 h-4"
                  style={{
                    color: "#805c5c",
                    transform: expandedMilestone === mi ? "rotate(90deg)" : "rotate(0)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>

              {expandedMilestone === mi && m.tasks && m.tasks.length > 0 && (
                <div style={{ padding: "0 20px 16px" }} className="fade-in">
                  {m.tasks.map((task, ti) => (
                    <div
                      key={ti}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: ti < m.tasks.length - 1 ? "1px solid rgba(34,57,71,0.05)" : "none",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200 }}>
                        <div style={{
                          width: 18,
                          height: 18,
                          borderRadius: 5,
                          flexShrink: 0,
                          border: "2px solid rgba(34,57,71,0.15)",
                        }} />
                        <span style={{ fontSize: 13, color: "#323232", fontWeight: 500 }}>
                          {task.title}
                        </span>
                      </div>
                      {task.step && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {task.step.s && <StepBadge label="S" value={task.step.s} color={color} />}
                          {task.step.t && <StepBadge label="T" value={task.step.t} color="#805c5c" />}
                          {task.step.e && <StepBadge label="E" value={task.step.e} color="#5b8a72" />}
                          {task.step.p && <StepBadge label="P" value={task.step.p} color="#223947" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tasks without milestones */}
      {(!template.milestones || template.milestones.length === 0) && template.tasks && template.tasks.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: 14,
          border: "1px solid rgba(34,57,71,0.08)",
          padding: 20,
        }}>
          <h3 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700,
            fontSize: 16,
            color: "#223947",
            marginBottom: 16,
          }}>
            Tasks
          </h3>
          {template.tasks.map((task, ti) => (
            <div
              key={ti}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "10px 0",
                borderBottom: ti < template.tasks.length - 1 ? "1px solid rgba(34,57,71,0.05)" : "none",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <div style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  flexShrink: 0,
                  border: "2px solid rgba(34,57,71,0.15)",
                }} />
                <span style={{ fontSize: 13, color: "#323232", fontWeight: 500 }}>
                  {task.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
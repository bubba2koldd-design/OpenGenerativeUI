"use client";

import { useState, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useAgent } from "@copilotkit/react-core/v2";
import { SEED_TEMPLATES } from "@/components/template-library/seed-templates";

type SaveState = "idle" | "input" | "saving" | "saved";

interface SaveTemplateOverlayProps {
  /** Title used as default template name */
  title: string;
  /** Description stored with the template */
  description: string;
  /** Raw HTML to save (for widget renderer templates) */
  html?: string;
  /** Structured data to save (for chart templates) */
  componentData?: Record<string, unknown>;
  /** The component type that produced this (e.g. "barChart", "pieChart", "widgetRenderer") */
  componentType: string;
  /** Whether content has finished rendering — button hidden until true */
  ready?: boolean;
  children: ReactNode;
}

export function SaveTemplateOverlay({
  title,
  description,
  html,
  componentData,
  componentType,
  ready = true,
  children,
}: SaveTemplateOverlayProps) {
  const { agent } = useAgent();
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [templateName, setTemplateName] = useState("");

  // Capture pending_template at mount time — it may be cleared by the agent later.
  // Uses ref (not state) to avoid an async re-render that would shift sibling positions
  // and cause React to remount the iframe, losing rendered 3D/canvas content.
  const pending = agent.state?.pending_template as { id: string; name: string } | null | undefined;
  const sourceRef = useRef<{ id: string; name: string } | null>(null);
  // eslint-disable-next-line react-hooks/refs -- one-time ref init during render (React-endorsed pattern)
  if (pending?.id && !sourceRef.current) {
    sourceRef.current = pending; // eslint-disable-line react-hooks/refs
  }

  // Check if this content matches an existing template:
  // 1. Exact HTML match (seed templates rendered as-is)
  // 2. Source template captured from pending_template (applied templates with modified data)
  const matchedTemplate = useMemo(() => {
    // First check source template from apply flow
    if (sourceRef.current) { // eslint-disable-line react-hooks/refs
      const allTemplates = [
        ...SEED_TEMPLATES,
        ...((agent.state?.templates as { id: string; name: string }[]) || []),
      ];
      const source = allTemplates.find((t) => t.id === sourceRef.current!.id); // eslint-disable-line react-hooks/refs
      if (source) return source;
    }
    // Then check exact HTML match
    if (!html) return null;
    const normalise = (s: string) => s.replace(/\s+/g, " ").trim();
    const norm = normalise(html);
    const allTemplates = [
      ...SEED_TEMPLATES,
      ...((agent.state?.templates as { id: string; name: string; html: string }[]) || []),
    ];
    return allTemplates.find((t) => t.html && normalise(t.html) === norm) ?? null;
  }, [html, agent.state?.templates]);

  const handleSave = useCallback(() => {
    const name = templateName.trim() || title || "Untitled Template";
    setSaveState("saving");

    const templates = agent.state?.templates || [];
    const newTemplate = {
      id: crypto.randomUUID(),
      name,
      description: description || title || "",
      html: html || "",
      component_type: componentType,
      component_data: componentData || null,
      data_description: "",
      created_at: new Date().toISOString(),
      version: 1,
    };
    agent.setState({ ...agent.state, templates: [...templates, newTemplate] });

    setTemplateName("");
    setTimeout(() => {
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1800);
    }, 400);
  }, [agent, templateName, title, description, html, componentData, componentType]);

  return (
    <div className="relative">
      {/* Save as Template button — hidden until content is ready */}
      <div
        className="absolute top-2 right-2 z-10 transition-opacity duration-500"
        style={{
          opacity: ready ? 1 : 0,
          pointerEvents: ready ? "auto" : "none",
        }}
      >
        {/* Saved confirmation */}
        {saveState === "saved" && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-md"
            style={{
              background: "var(--color-background-success, #EAF3DE)",
              color: "var(--color-text-success, #3B6D11)",
              border: "1px solid var(--color-border-success, #3B6D11)",
              animation: "tmpl-pop 0.35s cubic-bezier(.34,1.56,.64,1)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" style={{ strokeDasharray: 24, strokeDashoffset: 24, animation: "tmpl-check 0.4s ease-out 0.1s forwards" }} />
            </svg>
            Saved!
          </div>
        )}

        {/* Saving spinner */}
        {saveState === "saving" && (
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium shadow-md"
            style={{
              background: "var(--surface-primary, #fff)",
              border: "1px solid var(--color-border-glass, rgba(0,0,0,0.1))",
              color: "var(--text-secondary, #666)",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                border: "2px solid var(--color-border-tertiary, rgba(0,0,0,0.15))",
                borderTopColor: "var(--color-lilac-dark, #6366f1)",
                animation: "spin 0.6s linear infinite",
              }}
            />
            Saving...
          </div>
        )}

        {/* Name input */}
        {saveState === "input" && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 shadow-lg"
            style={{
              background: "var(--surface-primary, #fff)",
              border: "1px solid var(--color-border-glass, rgba(0,0,0,0.1))",
              animation: "tmpl-slideIn 0.2s ease-out",
            }}
          >
            <input
              type="text"
              placeholder="Template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setSaveState("idle");
                  setTemplateName("");
                }
              }}
              autoFocus
              className="text-xs px-2 py-1 rounded-md outline-none"
              style={{
                width: 140,
                background: "var(--color-background-secondary, #f5f5f5)",
                color: "var(--text-primary, #1a1a1a)",
                border: "1px solid var(--color-border-tertiary, rgba(0,0,0,0.1))",
              }}
            />
            <button
              onClick={handleSave}
              className="text-xs px-2 py-1 rounded-md font-medium text-white"
              style={{
                background: "linear-gradient(135deg, var(--color-lilac-dark, #6366f1), var(--color-mint-dark, #10b981))",
              }}
            >
              Save
            </button>
            <button
              onClick={() => { setSaveState("idle"); setTemplateName(""); }}
              className="text-xs px-1.5 py-1 rounded-md"
              style={{ color: "var(--text-secondary, #666)" }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Idle: show save button (badge moved outside this container) */}
        {saveState === "idle" && !matchedTemplate && (
          <button
            onClick={() => setSaveState("input")}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-md transition-all duration-150 hover:scale-105"
            style={{
              background: "var(--surface-primary, #fff)",
              border: "1px solid var(--color-border-glass, rgba(0,0,0,0.1))",
              color: "var(--text-secondary, #666)",
            }}
            title="Save as Template"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            Save as Template
          </button>
        )}
      </div>

      {/* Template name badge — shown above widget when matched */}
      {saveState === "idle" && matchedTemplate && ready && (
        <div className="flex justify-end mb-1">
          <div
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium"
            style={{
              background: "linear-gradient(135deg, rgba(99,102,241,0.10), rgba(16,185,129,0.10))",
              border: "1px solid rgba(99,102,241,0.20)",
              color: "var(--text-primary, #1a1a1a)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
            {matchedTemplate.name}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}

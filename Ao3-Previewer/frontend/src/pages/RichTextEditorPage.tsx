import { useRef, useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import DOMPurify from "dompurify";
import Button from "@mui/material/Button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";
import EditorToolbar from "../components/rich-text/EditorToolbar";
import EditorPane from "../components/rich-text/EditorPane";
import HtmlOutput from "../components/rich-text/HtmlOutput";
import SaveDraftDialog from "../components/editor/SaveDraftDialog";
import type { SavedDraftResult } from "../components/editor/SaveDraftDialog";
import { useDraftsIndexContext } from "../contexts/draftsIndexContext";
import type { GetDraftResponse } from "../api/drafts";
import { AO3_ALLOWED_TAGS, AO3_ALLOWED_ATTR } from "../allowlist/ao3HtmlAllowlist";
import "./RichTextEditorPage.css";

const STORAGE_KEY = "ao3-rich-text-state";
const STRIP_LTR = /\s+dir="ltr"/g;
const TEXT_ALIGN_STYLE = /\sstyle="text-align:\s*(left|center|right|justify);?"/gi;

function loadContent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveContent(html: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, html);
  } catch {}
}

export default function RichTextEditorPage() {
  const [html, setHtml] = useState(() => loadContent().replace(STRIP_LTR, ""));
  const [copied, setCopied] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const dragging = useRef(false);
  const location = useLocation();

  const draftsIndex = useDraftsIndexContext();
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const lastLoadedKeyRef = useRef<string | null>(null);

  const currentDraftTitle = draftsIndex.entries.find((e) => e.id === currentDraftId)?.title ?? "";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false } }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    textDirection: "ltr",
    content: loadContent(),
    onUpdate({ editor }) {
      const raw = editor.getHTML();
      saveContent(raw);
      setHtml(raw.replace(STRIP_LTR, ""));
    },
  });

  // Hand-off from the header's "My Drafts" navigation. Waits for the Tiptap editor instance
  // to be ready (it's null on first render), and is keyed on location.key (unique per
  // navigation) rather than a permanent "already loaded" flag, so opening a second draft
  // while one is already loaded — a navigation to the same route with new state — still fires.
  useEffect(() => {
    if (!editor || lastLoadedKeyRef.current === location.key) return;
    const draftToLoad = location.state?.draftToLoad as GetDraftResponse | undefined;
    if (!draftToLoad) return;
    lastLoadedKeyRef.current = location.key;
    editor.commands.setContent(draftToLoad.html);
    saveContent(draftToLoad.html);
    // One-time hand-off from the header's "My Drafts" navigation, not a derived sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHtml(draftToLoad.html.replace(STRIP_LTR, ""));
    setCurrentDraftId(draftToLoad.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, location.key]);

  const sanitizedHtml = useMemo(() => {
    const withAlign = html.replace(TEXT_ALIGN_STYLE, (_, value) => ` align="${value}"`);
    return DOMPurify.sanitize(withAlign, {
      ALLOWED_TAGS: AO3_ALLOWED_TAGS,
      ALLOWED_ATTR: AO3_ALLOWED_ATTR,
    });
  }, [html]);

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(sanitizedHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function clearEditor() {
    editor?.commands.setContent("");
    saveContent("");
    setHtml("");
  }

  function handleDraftSaved({ id, title, updatedAt }: SavedDraftResult) {
    setCurrentDraftId(id);
    draftsIndex.upsert({ id, title, updatedAt, payloadType: "richtext" });
  }

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    dragging.current = true;
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", stopDrag);
  }

  function onDrag(e: MouseEvent) {
    if (!dragging.current) return;
    const percent = (e.clientX / window.innerWidth) * 100;
    setLeftWidth(Math.min(80, Math.max(20, percent)));
  }

  function stopDrag() {
    dragging.current = false;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", stopDrag);
  }

  return (
    <div
      className="rich-text-page"
      style={{ "--rte-left-width": `${leftWidth}%` } as React.CSSProperties}
    >
      <div className="rte-toolbar-cell">
        <EditorToolbar editor={editor} />
      </div>

      <div className="rte-divider" onMouseDown={startDrag} />

      <div className="rte-html-header-cell">
        <span className="rte-html-header-title">HTML Output</span>
      </div>

      <div className="rte-editor-body-cell">
        <EditorPane editor={editor} />
      </div>

      <div className="rte-html-body-cell">
        <HtmlOutput html={sanitizedHtml} />
      </div>

      <div className="rte-editor-footer-cell">
        <Button
          size="small"
          variant="text"
          startIcon={<SaveIcon />}
          onClick={() => setSaveDialogOpen(true)}
        >
          Save Draft
        </Button>

        <Button
          size="small"
          variant="text"
          startIcon={<DeleteOutlineIcon />}
          onClick={clearEditor}
        >
          Clear
        </Button>
      </div>

      <div className="rte-html-footer-cell">
        <Button
          size="small"
          variant="text"
          startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
          onClick={copyHtml}
          color={copied ? "success" : "inherit"}
        >
          {copied ? "Copied!" : "Copy HTML"}
        </Button>
      </div>

      <SaveDraftDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        payloadType="richtext"
        html={sanitizedHtml}
        currentDraft={currentDraftId ? { id: currentDraftId, title: currentDraftTitle } : null}
        onSaved={handleDraftSaved}
      />
    </div>
  );
}

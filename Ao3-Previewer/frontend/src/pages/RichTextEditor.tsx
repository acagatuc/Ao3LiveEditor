import { useRef, useState, useMemo } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import DOMPurify from "dompurify";
import Button from "@mui/material/Button";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditorToolbar from "../components/rich-text/EditorToolbar";
import EditorPane from "../components/rich-text/EditorPane";
import HtmlOutput from "../components/rich-text/HtmlOutput";
import "./RichTextEditor.css";

const STORAGE_KEY = "ao3-rich-text-state";
const STRIP_LTR = /\s+dir="ltr"/g;

const AO3_TAGS = [
  "a",
  "abbr",
  "acronym",
  "address",
  "b",
  "big",
  "blockquote",
  "br",
  "caption",
  "center",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "ol",
  "p",
  "pre",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "small",
  "span",
  "strike",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "tt",
  "u",
  "ul",
  "var",
];

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

export default function RichTextEditor() {
  const [html, setHtml] = useState(() => loadContent().replace(STRIP_LTR, ""));
  const [copied, setCopied] = useState(false);
  const [leftWidth, setLeftWidth] = useState(50);
  const dragging = useRef(false);

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
    onError: ({ error }) => {
      console.error("Editor error:", error);
    },
  });

  const sanitizedHtml = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        ALLOWED_TAGS: AO3_TAGS,
        ALLOWED_ATTR: [
          "href",
          "src",
          "alt",
          "title",
          "class",
          "dir",
          "target",
          "rel",
          "align",
          "width",
          "height",
        ],
      }),
    [html],
  );

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
    </div>
  );
}

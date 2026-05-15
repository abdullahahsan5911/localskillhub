import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/layout/Navbar";
import { toast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiLink,
  FiLoader,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiAlignLeft,
  FiAlignCenter,
  FiAlignRight,
  FiCode,
  FiMinus,
} from "react-icons/fi";
import {
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuListOrdered,
  LuQuote,
  LuStrikethrough,
  LuUndo2,
  LuRedo2,
} from "react-icons/lu";

// ─── Toolbar Button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault(); // keep editor focus
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all
        ${
          active
            ? "bg-slate-900 text-white shadow-sm"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }
        disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="h-6 w-px bg-slate-200 mx-1" />;
}

// ─── Select dropdown in toolbar ───────────────────────────────────────────────

function ToolbarSelect({
  value,
  onChange,
  options,
  title,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  title: string;
}) {
  return (
    <select
      title={title}
      value={value}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArticleEditor() {
  const { communityId, articleId } = useParams<{
    communityId: string;
    articleId?: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState("");
  const [articleImages, setArticleImages] = useState<string[]>([]);
  const [articleLinks, setArticleLinks] = useState<string[]>([]);
  const [articleLinkInput, setArticleLinkInput] = useState("");
  const [articleImageUploading, setArticleImageUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [fontSize, setFontSize] = useState("16px");
  const [fontFamily, setFontFamily] = useState("inherit");

  useEffect(() => {
    if (!communityId) navigate("/communities");
  }, [communityId, navigate]);

  // Load article if editing
  useEffect(() => {
    if (articleId) {
      const loadArticle = async () => {
        try {
          const res = await api.getCommunityArticle(articleId);
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          if (data) {
            setTitle(data.title || "");
            if (editorRef.current) {
              editorRef.current.innerHTML = data.content || "";
            }
            setArticleImages(data.images || []);
            setArticleLinks(data.links || []);
          }
        } catch (error) {
          toast({ title: "Failed to load article", variant: "destructive" });
        }
      };
      loadArticle();
    }
  }, [articleId]);

  // Initialize editor
  useEffect(() => {
    if (editorRef.current && !articleId) {
      editorRef.current.focus();
    }
  }, [articleId]);

  // Track active formats on selection change
  const updateActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    if (document.queryCommandState("bold")) formats.add("bold");
    if (document.queryCommandState("italic")) formats.add("italic");
    if (document.queryCommandState("underline")) formats.add("underline");
    if (document.queryCommandState("strikeThrough"))
      formats.add("strikeThrough");
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul");
    if (document.queryCommandState("insertOrderedList")) formats.add("ol");
    if (document.queryCommandState("justifyCenter")) formats.add("center");
    if (document.queryCommandState("justifyRight")) formats.add("right");
    if (document.queryCommandState("justifyLeft")) formats.add("left");
    setActiveFormats(formats);
  }, []);

  const exec = useCallback(
    (cmd: string, value?: string) => {
      document.execCommand(cmd, false, value);
      editorRef.current?.focus();
      updateActiveFormats();
    },
    [updateActiveFormats],
  );

  const handleEditorInput = () => {
    const text = editorRef.current?.innerText || "";
    setCharCount(text.length);
    updateActiveFormats();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault();
          exec("bold");
          break;
        case "i":
          e.preventDefault();
          exec("italic");
          break;
        case "u":
          e.preventDefault();
          exec("underline");
          break;
        case "z":
          e.preventDefault();
          exec(e.shiftKey ? "redo" : "undo");
          break;
      }
    }
  };

  const insertHR = () => {
    exec("insertHTML", "<hr/><br/>");
  };

  const insertBlockquote = () => {
    exec("formatBlock", "blockquote");
  };

  const insertCodeBlock = () => {
    exec("insertHTML", "<pre><code>code here</code></pre><br/>");
  };

  // ─── Upload ──────────────────────────────────────────────────────────────────

  const uploadAttachmentImage = async (files: File[]) => {
    if (!files.length) return;
    setArticleImageUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadToCloudinary(file, "community-articles")),
      );
      const urls = uploaded.map((item) => item.url);
      setArticleImages((prev) => [...prev, ...urls]);
      toast({ title: `${urls.length} image(s) uploaded` });
    } catch (error) {
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setArticleImageUploading(false);
    }
  };

  const addAttachmentLink = () => {
    const trimmed = articleLinkInput.trim();
    if (!trimmed) return;
    const url = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    if (!articleLinks.includes(url)) {
      setArticleLinks((prev) => [...prev, url]);
      setArticleLinkInput("");
    }
  };

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const createArticle = async () => {
    const content = editorRef.current?.innerHTML || "";
    const plainText = editorRef.current?.innerText?.trim() || "";

    if (!title.trim() || !plainText) {
      toast({
        title: "Title and content are required",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (articleId) {
        await api.updateCommunityArticle(articleId, {
          title,
          content,
          images: articleImages,
          links: articleLinks,
          communityId,
        });
        toast({ title: "Article updated successfully" });
      } else {
        await api.createCommunityArticle({
          title,
          content, // rich HTML content
          images: articleImages,
          links: articleLinks,
          communityId,
        });
        toast({ title: "Article published successfully" });
      }
      navigate(`/communities/${communityId}`);
    } catch (error) {
      toast({ title: "Failed to publish article", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const fontFamilyOptions = [
    { label: "Default", value: "inherit" },
    { label: "Serif", value: "Georgia, serif" },
    { label: "Mono", value: "monospace" },
  ];

  const fontSizeOptions = [
    { label: "Small", value: "13px" },
    { label: "Normal", value: "16px" },
    { label: "Large", value: "20px" },
    { label: "XL", value: "24px" },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => navigate(`/communities/${communityId}`)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
              type="button"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Write an article
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Share your knowledge with your community
              </p>
            </div>
          </div>

          {/* Editor Card */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Title */}
            <div className="px-8 pt-8 pb-4 border-b border-slate-100">
              <input
                type="text"
                placeholder="Article title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-3xl font-bold text-slate-900 placeholder:text-slate-300 bg-transparent border-none outline-none resize-none"
              />
            </div>

            {/* Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-2 flex flex-wrap items-center gap-0.5 shadow-sm">
              {/* Undo / Redo */}
              <ToolbarBtn onClick={() => exec("undo")} title="Undo (Ctrl+Z)">
                <LuUndo2 size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("redo")}
                title="Redo (Ctrl+Shift+Z)"
              >
                <LuRedo2 size={15} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Font family */}
              <ToolbarSelect
                title="Font family"
                value={fontFamily}
                options={fontFamilyOptions}
                onChange={(v) => {
                  setFontFamily(v);
                  exec("fontName", v);
                }}
              />

              {/* Font size */}
              <ToolbarSelect
                title="Font size"
                value={fontSize}
                options={fontSizeOptions}
                onChange={(v) => {
                  setFontSize(v);
                  exec("fontSize", "3"); // reset
                  // Apply via CSS instead for precision
                  const sel = window.getSelection();
                  if (sel && sel.rangeCount > 0) {
                    const span = document.createElement("span");
                    span.style.fontSize = v;
                    const range = sel.getRangeAt(0);
                    range.surroundContents(span);
                  }
                  editorRef.current?.focus();
                }}
              />

              <ToolbarDivider />

              {/* Headings */}
              <ToolbarBtn
                onClick={() => exec("formatBlock", "h1")}
                title="Heading 1"
              >
                <LuHeading1 size={16} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("formatBlock", "h2")}
                title="Heading 2"
              >
                <LuHeading2 size={16} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("formatBlock", "h3")}
                title="Heading 3"
              >
                <LuHeading3 size={16} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Text formatting */}
              <ToolbarBtn
                onClick={() => exec("bold")}
                active={activeFormats.has("bold")}
                title="Bold (Ctrl+B)"
              >
                <FiBold size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("italic")}
                active={activeFormats.has("italic")}
                title="Italic (Ctrl+I)"
              >
                <FiItalic size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("underline")}
                active={activeFormats.has("underline")}
                title="Underline (Ctrl+U)"
              >
                <FiUnderline size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("strikeThrough")}
                active={activeFormats.has("strikeThrough")}
                title="Strikethrough"
              >
                <LuStrikethrough size={15} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Lists */}
              <ToolbarBtn
                onClick={() => exec("insertUnorderedList")}
                active={activeFormats.has("ul")}
                title="Bullet List"
              >
                <FiList size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("insertOrderedList")}
                active={activeFormats.has("ol")}
                title="Numbered List"
              >
                <LuListOrdered size={15} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Alignment */}
              <ToolbarBtn
                onClick={() => exec("justifyLeft")}
                active={activeFormats.has("left")}
                title="Align Left"
              >
                <FiAlignLeft size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("justifyCenter")}
                active={activeFormats.has("center")}
                title="Align Center"
              >
                <FiAlignCenter size={15} />
              </ToolbarBtn>
              <ToolbarBtn
                onClick={() => exec("justifyRight")}
                active={activeFormats.has("right")}
                title="Align Right"
              >
                <FiAlignRight size={15} />
              </ToolbarBtn>

              <ToolbarDivider />

              {/* Special blocks */}
              <ToolbarBtn onClick={insertBlockquote} title="Blockquote">
                <LuQuote size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={insertCodeBlock} title="Code block">
                <FiCode size={15} />
              </ToolbarBtn>
              <ToolbarBtn onClick={insertHR} title="Horizontal rule">
                <FiMinus size={15} />
              </ToolbarBtn>
            </div>

            {/* Content Editable Area */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handleEditorInput}
              onKeyDown={handleKeyDown}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              onSelect={updateActiveFormats}
              data-placeholder="Start writing your article here... Select text to format it using the toolbar above."
              className="
                min-h-[480px] px-8 py-6 outline-none text-slate-800 leading-relaxed text-base
                empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300
                [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mt-6 [&_h1]:mb-3
                [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-5 [&_h2]:mb-2
                [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-slate-800 [&_h3]:mt-4 [&_h3]:mb-2
                [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul_li]:mb-1
                [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol_li]:mb-1
                [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4
                [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote]:my-4
                [&_pre]:bg-slate-900 [&_pre]:text-emerald-400 [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:my-4 [&_pre]:overflow-auto
                [&_code]:font-mono [&_code]:text-sm
                [&_hr]:border-slate-200 [&_hr]:my-6
                [&_a]:text-blue-600 [&_a]:underline
                [&_p]:mb-3
              "
              style={{ fontFamily }}
            />

            {/* Character count */}
            <div className="px-8 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-400">{charCount} characters</p>
              <p className="text-xs text-slate-400">
                Tip: Select text then click toolbar buttons to format
              </p>
            </div>
          </div>

          {/* Images Section */}
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Images
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:border-slate-400 transition-colors">
                {articleImageUploading ? (
                  <>
                    <FiLoader size={14} className="animate-spin" /> Uploading...
                  </>
                ) : (
                  <>
                    <FiPlus size={14} /> Add images
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={articleImageUploading}
                  onChange={(e) =>
                    void uploadAttachmentImage(Array.from(e.target.files || []))
                  }
                />
              </label>
            </div>

            {articleImages.length > 0 && (
              <div className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                {articleImages.map((url, i) => (
                  <div
                    key={`${url}-${i}`}
                    className="relative overflow-hidden rounded-lg border border-slate-200 bg-white group"
                  >
                    <img
                      src={url}
                      alt=""
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setArticleImages((c) => c.filter((_, idx) => idx !== i))
                      }
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Links Section */}
          <div className="mt-4 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              References & Links
            </label>
            <div className="flex gap-2">
              <Input
                value={articleLinkInput}
                onChange={(e) => setArticleLinkInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAttachmentLink();
                  }
                }}
                placeholder="https://example.com"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={addAttachmentLink}
                className="shrink-0 rounded-lg px-4"
              >
                Add
              </Button>
            </div>

            {articleLinks.length > 0 && (
              <div className="mt-4 space-y-2">
                {articleLinks.map((link) => (
                  <div
                    key={link}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FiLink size={14} className="text-slate-400 shrink-0" />
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate"
                      >
                        {link}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setArticleLinks((c) => c.filter((l) => l !== link))
                      }
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/communities/${communityId}`)}
              disabled={submitting}
              className="rounded-lg px-6"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={createArticle}
              disabled={submitting || !title.trim()}
              className="rounded-lg px-6"
            >
              {submitting
                ? "Saving..."
                : articleId
                  ? "Update Article"
                  : "Publish Article"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { Bold, Code, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Quote, Strikethrough, Upload } from "lucide-react";
import { createBlog, updateBlog, type BlogActionState } from "@/lib/actions/blogs";
import { generateArticleCopy } from "@/lib/actions/ai";

type BlogEditorProps = {
  article?: {
    id: string;
    title: string;
    slug: string;
    description: string;
    content: unknown;
    coverImageUrl: string | null;
    coverImageAlt: string | null;
    status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
    scheduledFor: Date | null;
    seoTitle: string | null;
    seoDescription: string | null;
    categoryNames: string;
    tagNames: string;
  };
};

const emptyDocument = { type: "doc", content: [{ type: "paragraph" }] };

export function BlogEditor({ article }: BlogEditorProps) {
  const action = article ? updateBlog.bind(null, article.id) : createBlog;
  const [state, formAction, pending] = useActionState<BlogActionState, FormData>(action, {});
  const [content, setContent] = useState(JSON.stringify(article?.content ?? emptyDocument));
  const [title, setTitle] = useState(article?.title ?? "");
  const [description, setDescription] = useState(article?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(article?.coverImageUrl ?? "");
  const [scheduleLocal, setScheduleLocal] = useState("");
  const [scheduleIso, setScheduleIso] = useState(article?.scheduledFor?.toISOString() ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [aiPending, startAiTransition] = useTransition();
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, LinkExtension.configure({ openOnClick: false, protocols: ["https", "mailto"] })],
    content: article?.content ?? emptyDocument,
    editorProps: { attributes: { class: "editor-canvas", "aria-label": "Article body" } },
    onUpdate: ({ editor: currentEditor }) => setContent(JSON.stringify(currentEditor.getJSON())),
  });

  useEffect(() => {
    if (!article?.scheduledFor) return;
    const localDate = new Date(article.scheduledFor.getTime() - article.scheduledFor.getTimezoneOffset() * 60_000);
    setScheduleLocal(localDate.toISOString().slice(0, 16));
  }, [article?.scheduledFor]);

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadMessage("Choose an image smaller than 5 MB.");
      return;
    }
    setUploading(true);
    setUploadMessage("");
    const formData = new FormData();
    formData.set("file", file);
    try {
      const response = await fetch("/api/v1/uploads", { method: "POST", body: formData });
      const result = await response.json() as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error ?? "Upload failed.");
      setCoverImageUrl(result.url);
      setUploadMessage("Image uploaded.");
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const href = window.prompt("Paste an https or email link");
    if (!href || !(href.startsWith("https://") || href.startsWith("mailto:"))) return;
    editor?.chain().focus().setLink({ href }).run();
  }

  function suggestCopy(kind: "title" | "summary") {
    const articleText = editor?.getText() ?? "";
    setAiMessage("");
    startAiTransition(async () => {
      const result = await generateArticleCopy(kind, articleText);
      if (!result.text) {
        setAiMessage(result.error ?? "No suggestion available.");
        return;
      }
      if (kind === "title") setTitle(result.text);
      else setDescription(result.text);
      setAiMessage("Suggestion added. Review it before publishing.");
    });
  }

  return (
    <form action={formAction} className="blog-editor-form">
      <div className="editor-main-fields">
        <label className="editor-label" htmlFor="title">Title</label>
        <input className="editor-title-input" id="title" maxLength={180} name="title" onChange={(event) => setTitle(event.target.value)} placeholder="A title that opens a door..." value={title} />
        <button className="ai-suggestion-button" disabled={aiPending} onClick={() => suggestCopy("title")} type="button">{aiPending ? "Thinking..." : "Suggest a title"}</button>
        <label className="editor-label" htmlFor="description">Description</label>
        <textarea className="editor-description-input" id="description" maxLength={320} name="description" onChange={(event) => setDescription(event.target.value)} placeholder="The short version. Aim for 20 to 320 characters when publishing." rows={3} value={description} />
        <button className="ai-suggestion-button" disabled={aiPending} onClick={() => suggestCopy("summary")} type="button">{aiPending ? "Thinking..." : "Suggest a summary"}</button>
        <p aria-live="polite" className="field-hint">{aiMessage}</p>
        <input defaultValue={article?.slug ?? ""} maxLength={100} name="slug" placeholder="story-url (optional, generated from title)" />
        <div className="editor-toolbar" aria-label="Text formatting">
          <button aria-label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} title="Bold" type="button"><Bold size={16} /></button>
          <button aria-label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} title="Italic" type="button"><Italic size={16} /></button>
          <button aria-label="Strikethrough" onClick={() => editor?.chain().focus().toggleStrike().run()} title="Strikethrough" type="button"><Strikethrough size={16} /></button>
          <button aria-label="Heading" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading" type="button"><Heading2 size={17} /></button>
          <button aria-label="Bulleted list" onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Bulleted list" type="button"><List size={17} /></button>
          <button aria-label="Numbered list" onClick={() => editor?.chain().focus().toggleOrderedList().run()} title="Numbered list" type="button"><ListOrdered size={17} /></button>
          <button aria-label="Quote" onClick={() => editor?.chain().focus().toggleBlockquote().run()} title="Quote" type="button"><Quote size={16} /></button>
          <button aria-label="Code block" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Code block" type="button"><Code size={16} /></button>
          <button aria-label="Add link" onClick={addLink} title="Add link" type="button"><LinkIcon size={16} /></button>
          <span className="toolbar-count">{editor?.getText().length ?? 0}</span>
        </div>
        <EditorContent editor={editor} />
        <input name="content" type="hidden" value={content} />
      </div>

      <aside className="editor-settings">
        <div className="editor-settings-heading"><span>STORY SETTINGS</span><span>{article && <Link href={`/dashboard/articles/${article.id}/preview`}>Preview</Link>} <Link href="/dashboard/articles">Close</Link></span></div>
        <label className="editor-label" htmlFor="coverImageUrl">Cover image</label>
        <input id="coverImageUrl" onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="Image URL or upload" value={coverImageUrl} />
        <input name="coverImageUrl" type="hidden" value={coverImageUrl} />
        <label className="upload-button">
          <Upload size={15} /> {uploading ? "Uploading..." : "Upload image"}
          <input accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => void uploadImage(event.target.files?.[0])} type="file" />
        </label>
        <p aria-live="polite" className="field-hint">{uploadMessage}</p>
        <label className="editor-label" htmlFor="coverImageAlt">Image description</label>
        <input defaultValue={article?.coverImageAlt ?? ""} id="coverImageAlt" maxLength={250} name="coverImageAlt" placeholder="Describe the image for readers" />
        <label className="editor-label" htmlFor="categories">Categories</label>
        <input defaultValue={article?.categoryNames ?? ""} id="categories" name="categories" placeholder="Design, Culture" />
        <label className="editor-label" htmlFor="tags">Tags</label>
        <input defaultValue={article?.tagNames ?? ""} id="tags" name="tags" placeholder="Comma-separated tags" />
        <details className="seo-settings">
          <summary>Search preview</summary>
          <label className="editor-label" htmlFor="seoTitle">SEO title</label>
          <input defaultValue={article?.seoTitle ?? ""} id="seoTitle" maxLength={70} name="seoTitle" />
          <label className="editor-label" htmlFor="seoDescription">SEO description</label>
          <textarea defaultValue={article?.seoDescription ?? ""} id="seoDescription" maxLength={180} name="seoDescription" rows={3} />
        </details>
        <label className="editor-label" htmlFor="scheduledForLocal">Schedule for (your local time)</label>
        <input id="scheduledForLocal" onChange={(event) => {
          const value = event.target.value;
          setScheduleLocal(value);
          const date = value ? new Date(value) : null;
          setScheduleIso(date && !Number.isNaN(date.valueOf()) ? date.toISOString() : "");
        }} type="datetime-local" value={scheduleLocal} />
        <input name="scheduledFor" type="hidden" value={scheduleIso} />
        <p aria-live="polite" className="form-message is-error">{state.error ?? ""}</p>
        <div className="editor-submit-actions">
          <button className="button editor-save-button" disabled={pending} name="status" type="submit" value="DRAFT">{pending ? "Saving..." : "Save draft"}</button>
          <button className="button editor-publish-button" disabled={pending} name="status" type="submit" value="PUBLISHED">Publish</button>
          <button className="text-link editor-schedule-button" disabled={pending} name="status" type="submit" value="SCHEDULED">Schedule</button>
        </div>
      </aside>
    </form>
  );
}
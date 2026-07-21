import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Youtube } from '@tiptap/extension-youtube';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';
import { CharacterCount } from '@tiptap/extension-character-count';
import {
    AlignCenter, AlignLeft, AlignRight, Bold, Code, Heading1, Heading2, Heading3,
    Highlighter, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Pilcrow,
    Quote, Redo2, Strikethrough, Table2, Underline as UnderlineIcon, Undo2, Video,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { api, messageFrom } from '../api/client';

function toHtml(value) {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (!trimmed) return '';
    if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
    return `<p>${trimmed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br>')}</p>`;
}

export default function RichEditor({ value = '', onChange, placeholder = 'Write your page content…', required = false }) {
    const fileRef = useRef(null);
    const uploading = useRef(false);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
            Underline,
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
            Image.configure({ allowBase64: false, HTMLAttributes: { class: 'editor-image' } }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({ placeholder }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: 'editor-youtube' } }),
            CharacterCount,
        ],
        content: toHtml(value),
        editorProps: {
            attributes: {
                class: 'rich-editor-content',
                'aria-required': required ? 'true' : 'false',
            },
        },
        onUpdate: ({ editor: ed }) => onChange?.(ed.isEmpty ? '' : ed.getHTML()),
    });

    useEffect(() => {
        if (!editor) return;
        const incoming = toHtml(value);
        const current = editor.isEmpty ? '' : editor.getHTML();
        if (incoming !== current) {
            editor.commands.setContent(incoming || '', { emitUpdate: false });
        }
    }, [value, editor]);

    if (!editor) return <div className="rich-editor loading-editor">Loading editor…</div>;

    const setLink = () => {
        const previous = editor.getAttributes('link').href || '';
        const url = window.prompt('Enter link URL', previous);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImageUrl = () => {
        const url = window.prompt('Image URL');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    const uploadImage = async (file) => {
        if (!file || uploading.current) return;
        uploading.current = true;
        try {
            const body = new FormData();
            body.append('file', file);
            const { data } = await api.post('/cp/media', body);
            const url = data.url || data.data?.url;
            if (url) editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        } catch (err) {
            alert(messageFrom(err) || 'Image upload failed.');
        } finally {
            uploading.current = false;
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const addYoutube = () => {
        const url = window.prompt('YouTube video URL');
        if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    return <div className="rich-editor">
        <div className="rich-toolbar" role="toolbar" aria-label="Formatting">
            <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 /></ToolbarBtn>
            <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 /></ToolbarBtn>
            <span className="toolbar-sep" />
            <ToolbarBtn title="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow /></ToolbarBtn>
            <ToolbarBtn title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 /></ToolbarBtn>
            <ToolbarBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 /></ToolbarBtn>
            <ToolbarBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 /></ToolbarBtn>
            <span className="toolbar-sep" />
            <ToolbarBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold /></ToolbarBtn>
            <ToolbarBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic /></ToolbarBtn>
            <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon /></ToolbarBtn>
            <ToolbarBtn title="Strike" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough /></ToolbarBtn>
            <ToolbarBtn title="Highlight" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}><Highlighter /></ToolbarBtn>
            <ToolbarBtn title="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}><Code /></ToolbarBtn>
            <label className="toolbar-color" title="Text color">
                <input type="color" value={editor.getAttributes('textStyle').color || '#10223a'} onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} />
            </label>
            <span className="toolbar-sep" />
            <ToolbarBtn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft /></ToolbarBtn>
            <ToolbarBtn title="Align center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter /></ToolbarBtn>
            <ToolbarBtn title="Align right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight /></ToolbarBtn>
            <span className="toolbar-sep" />
            <ToolbarBtn title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List /></ToolbarBtn>
            <ToolbarBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered /></ToolbarBtn>
            <ToolbarBtn title="Quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote /></ToolbarBtn>
            <ToolbarBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus /></ToolbarBtn>
            <span className="toolbar-sep" />
            <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={setLink}><Link2 /></ToolbarBtn>
            <ToolbarBtn title="Upload image" onClick={() => fileRef.current?.click()}><ImagePlus /></ToolbarBtn>
            <ToolbarBtn title="Image from URL" onClick={addImageUrl}><ImagePlus style={{ opacity: 0.65 }} /></ToolbarBtn>
            <ToolbarBtn title="YouTube" onClick={addYoutube}><Video /></ToolbarBtn>
            <ToolbarBtn title="Insert table" onClick={insertTable}><Table2 /></ToolbarBtn>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadImage(e.target.files?.[0])} />
        </div>
        <EditorContent editor={editor} />
        <div className="rich-editor-meta">
            <span>{editor.storage.characterCount.characters()} characters</span>
            <span>{editor.storage.characterCount.words()} words</span>
        </div>
    </div>;
}

function ToolbarBtn({ children, onClick, active, disabled, title }) {
    return <button type="button" title={title} className={active ? 'active' : ''} disabled={disabled} onClick={onClick}>{children}</button>;
}

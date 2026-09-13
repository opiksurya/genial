import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { 
    BookOpen, 
    ArrowLeft, 
    Save, 
    ExternalLink, 
    Image as ImageIcon, 
    Bold, 
    Italic, 
    List, 
    ListOrdered, 
    Quote, 
    Heading1, 
    Heading2, 
    Heading3, 
    Undo, 
    Redo, 
    Sparkles, 
    TrendingUp, 
    DollarSign, 
    Clock, 
    CheckCircle2,
    Code,
    Strikethrough,
    Link as LinkIcon,
    Minus
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';

interface Project {
    id: number;
    name: string;
    client: string;
    client_logo?: string;
    slug?: string;
    article_title?: string;
    article_subtitle?: string;
    article_content?: string;
    initial_revenue?: string;
    current_revenue?: string;
    initial_roas?: string;
    current_roas?: string;
    growth_percentage?: string;
    collaboration_story?: string;
    key_results?: string;
}

interface ArticleEditorProps {
    project: Project;
}

export default function ArticleEditor({ project }: ArticleEditorProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'ProjectFlow', href: '/projects/dashboard' },
        { title: 'Project Board', href: `/projects/board?project_id=${project.id}` },
        { title: `Artikel ${project.client}`, href: `/projects/${project.id}/article` },
    ];

    const form = useForm({
        slug: project.slug || '',
        article_title: project.article_title || '',
        article_subtitle: project.article_subtitle || '',
        article_content: project.article_content || '',
        initial_revenue: project.initial_revenue || '',
        current_revenue: project.current_revenue || '',
        initial_roas: project.initial_roas || '',
        current_roas: project.current_roas || '',
        growth_percentage: project.growth_percentage || '',
        collaboration_story: project.collaboration_story || '',
        key_results: project.key_results || '',
    });

    const [uploadingImage, setUploadingImage] = useState(false);

    // Initialize TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension.configure({
                inline: true,
                allowBase64: true,
            }),
            LinkExtension.configure({
                openOnClick: false,
            }),
        ],
        content: form.data.article_content || `<p>Tuliskan naskah artikel studi kasus lengkap untuk brand <strong>${project.client}</strong> di sini...</p>`,
        onUpdate: ({ editor }) => {
            form.setData('article_content', editor.getHTML());
        },
    });

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/projects/upload-article-image', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                if (data.url) {
                    editor.chain().focus().setImage({ src: data.url }).run();
                }
            } else {
                alert('Gagal mengunggah gambar. Pastikan format PNG/JPG max 5MB.');
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan saat mengunggah gambar.');
        } finally {
            setUploadingImage(false);
        }
    };

    const setLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('Masukkan URL Link:', previousUrl || 'https://');

        if (url === null) return;
        if (url === '' || url === 'https://') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editor) {
            form.setData('article_content', editor.getHTML());
        }
        form.post(`/projects/${project.id}/article`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editor Artikel ${project.client} - CMS Genial`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
                
                {/* HEADER ACTIONS */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-sidebar-border pb-4">
                    <div className="flex items-center gap-3">
                        <a 
                            href={`/projects/board?project_id=${project.id}`}
                            className="p-2 rounded-xl border border-sidebar-border hover:bg-muted text-muted-foreground transition-colors"
                            title="Kembali ke Board"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                        {project.client_logo && (
                            <img src={project.client_logo} alt={project.client} className="h-10 w-auto object-contain max-w-[100px]" />
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <span>Editor Artikel & Case Study:</span>
                                <span className="text-primary font-extrabold">{project.client}</span>
                            </h1>
                            <p className="text-xs text-muted-foreground">Kelola naskah artikel, gambar pendukung, dan angka perbandingan omset.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {form.data.slug && (
                            <a
                                href={`/case-study/${form.data.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-xl border border-sidebar-border text-xs font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <ExternalLink className="w-4 h-4 text-cyan-400" />
                                <span>Preview Halaman Publik</span>
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={form.processing}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] text-slate-900 text-xs font-extrabold hover:opacity-95 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            <span>Simpan Artikel Brand</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT 2 COLUMNS: RICH TEXT ARTICLE EDITOR */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Judul & Subtitle */}
                        <div className="p-6 rounded-2xl bg-card border border-sidebar-border shadow-xs space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Judul Utama Artikel Case Study *</label>
                                <input 
                                    type="text" 
                                    required
                                    value={form.data.article_title}
                                    onChange={(e) => form.setData('article_title', e.target.value)}
                                    placeholder="contoh: Transformasi Digital BatikKu: Dari Toko Lokal Menjadi E-Commerce Skala Nasional"
                                    className="w-full px-4 py-2.5 rounded-xl border border-sidebar-border bg-background text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Subtitle / Sub-header Artikel</label>
                                <textarea 
                                    rows={2}
                                    value={form.data.article_subtitle}
                                    onChange={(e) => form.setData('article_subtitle', e.target.value)}
                                    placeholder="Ringkasan singkat cerita sukses 1-2 kalimat..."
                                    className="w-full px-4 py-2 rounded-xl border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* TIPTAP RICH TEXT EDITOR CONTAINER */}
                        <div className="p-6 rounded-2xl bg-card border border-sidebar-border shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-sidebar-border pb-3">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">Isi Artikel & Narasi Strategi (Rich Text Editor)</h3>
                                </div>
                                <span className="text-[11px] text-muted-foreground">Format artikel lengkap dengan typography & gambar</span>
                            </div>

                            {/* TipTap Toolbar */}
                            {editor && (
                                <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-muted/50 border border-sidebar-border">
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                        className={`p-1.5 rounded-lg text-xs font-bold ${editor.isActive('heading', { level: 1 }) ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Heading 1"
                                    >
                                        <Heading1 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                        className={`p-1.5 rounded-lg text-xs font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Heading 2"
                                    >
                                        <Heading2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                        className={`p-1.5 rounded-lg text-xs font-bold ${editor.isActive('heading', { level: 3 }) ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Heading 3"
                                    >
                                        <Heading3 className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-5 bg-sidebar-border mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleBold().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('bold') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Bold (Tebal)"
                                    >
                                        <Bold className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleItalic().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('italic') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Italic (Miring)"
                                    >
                                        <Italic className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleStrike().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('strike') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Coret"
                                    >
                                        <Strikethrough className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleCode().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('code') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Format Kode"
                                    >
                                        <Code className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-5 bg-sidebar-border mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('bulletList') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Bullet List"
                                    >
                                        <List className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('orderedList') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Numbered List"
                                    >
                                        <ListOrdered className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                        className={`p-1.5 rounded-lg ${editor.isActive('blockquote') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Kutipan (Quote)"
                                    >
                                        <Quote className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={setLink}
                                        className={`p-1.5 rounded-lg ${editor.isActive('link') ? 'bg-primary text-white' : 'hover:bg-muted text-foreground'}`}
                                        title="Sisipkan Link (Hyperlink)"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                                        className="p-1.5 rounded-lg hover:bg-muted text-foreground"
                                        title="Garis Pemisah (Horizontal Rule)"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-5 bg-sidebar-border mx-1" />

                                    {/* Image Upload Button */}
                                    <label className="p-1.5 rounded-lg hover:bg-muted text-foreground cursor-pointer flex items-center gap-1 text-xs font-semibold" title="Sisipkan Foto / Gambar ke Artikel">
                                        <ImageIcon className="w-4 h-4 text-emerald-500" />
                                        <span>{uploadingImage ? 'Mengunggah...' : 'Upload Foto'}</span>
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleImageUpload} 
                                            disabled={uploadingImage}
                                            className="hidden" 
                                        />
                                    </label>

                                    <div className="w-px h-5 bg-sidebar-border mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().undo().run()}
                                        className="p-1.5 rounded-lg hover:bg-muted text-foreground"
                                        title="Undo"
                                    >
                                        <Undo className="w-4 h-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => editor.chain().focus().redo().run()}
                                        className="p-1.5 rounded-lg hover:bg-muted text-foreground"
                                        title="Redo"
                                    >
                                        <Redo className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Editor View Area */}
                            <div className="min-h-[350px] p-4 rounded-xl border border-sidebar-border bg-background focus-within:ring-1 focus-within:ring-primary">
                                <EditorContent editor={editor} className="prose dark:prose-invert max-w-none text-sm leading-relaxed" />
                            </div>
                        </div>

                        {/* Cerita Perjalanan Awal Bertemu Genial */}
                        <div className="p-6 rounded-2xl bg-card border border-sidebar-border shadow-xs space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-cyan-400" />
                                <label className="block text-xs font-bold text-foreground">Perjalanan Awal Bertemu Genial (Latar Belakang Story)</label>
                            </div>
                            <textarea 
                                rows={4}
                                value={form.data.collaboration_story}
                                onChange={(e) => form.setData('collaboration_story', e.target.value)}
                                placeholder="Tuliskan cerita pertama kali bertemu Genial, kendala awal sebelum bekerjasama, dan alur perbaikan yang dilakukan..."
                                className="w-full px-4 py-2.5 rounded-xl border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                            />
                        </div>

                    </div>

                    {/* RIGHT COLUMN: FIGURES & METRICS PANEL */}
                    <div className="space-y-6">
                        
                        {/* Slug & Growth Badge */}
                        <div className="p-6 rounded-2xl bg-card border border-sidebar-border shadow-xs space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-sidebar-border pb-2">
                                Identitas URL & Badge
                            </h3>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1">URL Slug (Unik)</label>
                                <input 
                                    type="text" 
                                    required
                                    value={form.data.slug}
                                    onChange={(e) => form.setData('slug', e.target.value)}
                                    placeholder="contoh: glowing-id"
                                    className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                    Link Publik: <code className="text-primary font-bold">/case-study/{form.data.slug || 'slug'}</code>
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-foreground mb-1">Badge Peningkatan Growth (%)</label>
                                <input 
                                    type="text" 
                                    value={form.data.growth_percentage}
                                    onChange={(e) => form.setData('growth_percentage', e.target.value)}
                                    placeholder="contoh: +380% atau +413%"
                                    className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* ANGKA AWAL VS SEKARANG */}
                        <div className="p-6 rounded-2xl bg-card border border-sidebar-border shadow-xs space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-sidebar-border pb-2 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                <span>Angka Perbandingan Awal vs Sekarang</span>
                            </h3>

                            <div>
                                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">Omset Awal (Sebelum Genial)</label>
                                <input 
                                    type="text" 
                                    value={form.data.initial_revenue}
                                    onChange={(e) => form.setData('initial_revenue', e.target.value)}
                                    placeholder="contoh: Rp 35.000.000 / bln"
                                    className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-emerald-400 mb-1">Omset Sekarang (Post Genial)</label>
                                <input 
                                    type="text" 
                                    value={form.data.current_revenue}
                                    onChange={(e) => form.setData('current_revenue', e.target.value)}
                                    placeholder="contoh: Rp 168.000.000 / bln"
                                    className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <div>
                                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">ROAS Awal</label>
                                    <input 
                                        type="text" 
                                        value={form.data.initial_roas}
                                        onChange={(e) => form.setData('initial_roas', e.target.value)}
                                        placeholder="2.1x"
                                        className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-sky-400 mb-1">ROAS Sekarang</label>
                                    <input 
                                        type="text" 
                                        value={form.data.current_roas}
                                        onChange={(e) => form.setData('current_roas', e.target.value)}
                                        placeholder="7.8x"
                                        className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs font-bold text-sky-400 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KEY RESULTS LIST */}
                        <div className="p-6 rounded-2xl bg-card border border-sidebar-border shadow-xs space-y-3">
                            <label className="block text-xs font-bold text-foreground">Poin-Poin Hasil Utama (Per-baris)</label>
                            <textarea 
                                rows={4}
                                value={form.data.key_results}
                                onChange={(e) => form.setData('key_results', e.target.value)}
                                placeholder="- Omset naik dari Rp 35 Juta menjadi Rp 168 Juta&#10;- ROAS Iklan stabil 7.8x&#10;- Sistem ERP terintegrasi bebas selisih stok"
                                className="w-full px-3 py-2 rounded-xl border border-sidebar-border bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-[10px] text-muted-foreground block">Tuliskan tiap poin hasil dengan diawali tanda minus (-) atau baris baru.</span>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#2D90CA] via-[#00A9E7] to-[#05BAF0] text-slate-900 text-sm font-extrabold hover:opacity-95 transition-all shadow-lg shadow-[#00A9E7]/25 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save className="w-5 h-5 text-slate-900" />
                            <span>Simpan Seluruh Artikel & Data</span>
                        </button>

                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function WriteBlog() {
    const router = useRouter();
    const [expert, setExpert] = useState<{ name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
    });
    const [error, setError] = useState('');

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/expert/me');
            const data = await res.json();

            if (data.success) {
                setExpert(data.expert);
            } else {
                router.push('/expert/login');
            }
        } catch (error) {
            router.push('/expert/login');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (formData.title.length < 10) {
            setError('Title must be at least 10 characters');
            setSubmitting(false);
            return;
        }

        if (formData.content.length < 50) {
            setError('Content must be at least 50 characters');
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch('/api/blogs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                router.push('/blogs');
            } else {
                setError(data.error || 'Failed to create blog');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-blue-400">
                        Next-StockMarket
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/expert/profile"
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Profile
                        </Link>
                        <Link
                            href="/blogs"
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            All Blogs
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Write a Blog</h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Share your market analysis and investment insights
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-6">
                    {error && (
                        <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Blog Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter a compelling title for your blog"
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Minimum 10 characters. Current: {formData.title.length}
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-400 mb-2">Content *</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            placeholder="Write your market analysis, insights, or advice here..."
                            rows={15}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Minimum 50 characters. Current: {formData.content.length}
                        </p>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                        <p className="text-sm text-gray-400">
                            Publishing as <span className="text-blue-400">{expert?.name}</span>
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="/blogs"
                                className="px-6 py-2 text-gray-400 hover:text-white transition"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-8 rounded-lg transition disabled:opacity-50"
                            >
                                {submitting ? 'Publishing...' : 'Publish Blog'}
                            </button>
                        </div>
                    </div>
                </form>

                <div className="mt-8 bg-gray-800/50 rounded-xl p-6">
                    <h3 className="font-semibold mb-3">💡 Writing Tips</h3>
                    <ul className="text-sm text-gray-400 space-y-2">
                        <li>• Be specific with your market analysis and provide data when possible</li>
                        <li>• Clearly state if content is opinion or factual analysis</li>
                        <li>• Include disclaimers for investment-related advice</li>
                        <li>• Keep your writing clear and accessible to all readers</li>
                        <li>• Proofread before publishing to maintain credibility</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Blog {
    id: string;
    title: string;
    content: string;
    expertName: string;
    expertDesignation: string;
    expertImage: string | null;
    createdAt: string;
}

interface Expert {
    id: string;
    name: string;
    email: string;
    designation: string;
}

export default function BlogDetail() {
    const params = useParams();
    const [blog, setBlog] = useState<Blog | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expert, setExpert] = useState<Expert | null>(null);

    useEffect(() => {
        if (params.id) {
            fetchBlog(params.id as string);
        }
        fetchExpert();
    }, [params.id]);

    const fetchExpert = async () => {
        try {
            const res = await fetch('/api/expert/me');
            const data = await res.json();
            if (data.success && data.expert) {
                setExpert(data.expert);
            }
        } catch (error) {
            // Not logged in
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/expert/logout', { method: 'POST' });
            setExpert(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const fetchBlog = async (id: string) => {
        try {
            const res = await fetch(`/api/blogs/${id}`);
            const data = await res.json();

            if (data.success) {
                setBlog(data.blog);
            } else {
                setError(data.error || 'Blog not found');
            }
        } catch (err) {
            setError('Failed to fetch blog');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">{error || 'Blog not found'}</h1>
                    <Link href="/blogs" className="text-blue-400 hover:underline">
                        ← Back to Blogs
                    </Link>
                </div>
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
                        <Link href="/blogs" className="text-gray-400 hover:text-white text-sm">
                            All Blogs
                        </Link>
                        <Link href="/" className="text-gray-400 hover:text-white text-sm">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {/* Back Link */}
                <Link href="/blogs" className="text-gray-400 hover:text-white text-sm mb-6 inline-flex items-center gap-1">
                    ← Back to Blogs
                </Link>

                {/* Blog Article */}
                <article className="bg-gray-800 rounded-xl p-8 mt-4">
                    {/* Author Info */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
                        {blog.expertImage ? (
                            <img
                                src={blog.expertImage}
                                alt={blog.expertName}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold">
                                {blog.expertName.charAt(0)}
                            </div>
                        )}
                        <div>
                            <p className="text-lg font-semibold">{blog.expertName}</p>
                            <p className="text-gray-400">{blog.expertDesignation}</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Published on{' '}
                                {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold mb-6">{blog.title}</h1>

                    {/* Content */}
                    <div className="prose prose-invert max-w-none">
                        {blog.content.split('\n').map((paragraph, index) => (
                            <p key={index} className="text-gray-300 leading-relaxed mb-4">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-8 pt-6 border-t border-gray-700">
                        <p className="text-xs text-gray-500">
                            <strong>Disclaimer:</strong> This blog is for educational and informational purposes only. 
                            The views expressed are those of the author and do not constitute financial advice. 
                            Please consult a qualified financial advisor before making any investment decisions.
                        </p>
                    </div>
                </article>

                {/* Share Section */}
                <div className="mt-6 bg-gray-800/50 rounded-xl p-6">
                    <p className="text-sm text-gray-400 mb-3">Found this helpful?</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: blog.title,
                                        text: `Check out this article by ${blog.expertName}`,
                                        url: window.location.href,
                                    });
                                } else {
                                    navigator.clipboard.writeText(window.location.href);
                                    alert('Link copied to clipboard!');
                                }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm transition"
                        >
                            Share Article
                        </button>
                        <Link href="/blogs" className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition">
                            Read More Blogs
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 mt-12">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm">© 2025 Next-StockMarket</p>
                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-gray-400 hover:text-white text-sm">
                                Dashboard
                            </Link>
                            <Link href="/blogs" className="text-gray-400 hover:text-white text-sm">
                                All Blogs
                            </Link>
                            {expert ? (
                                <>
                                    <Link href="/expert/profile" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link href="/expert/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                                    Expert Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

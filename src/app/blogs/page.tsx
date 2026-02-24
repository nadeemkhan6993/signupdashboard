'use client';

import { useEffect, useState } from 'react';
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

export default function BlogsPage() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expert, setExpert] = useState<Expert | null>(null);

    useEffect(() => {
        fetchBlogs();
        fetchExpert();
    }, []);

    const fetchBlogs = async () => {
        try {
            const res = await fetch('/api/blogs');
            const data = await res.json();
            if (data.success) {
                setBlogs(data.blogs);
            }
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

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
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-blue-400">
                        Next-StockMarket
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/" className="text-gray-400 hover:text-white text-sm">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Expert Blogs</h1>
                    <p className="text-gray-400 mt-2">
                        Market insights and analysis from our financial experts
                    </p>
                </div>

                {blogs.length === 0 ? (
                    <div className="bg-gray-800 rounded-xl p-12 text-center">
                        <p className="text-gray-400 text-lg">No blogs available yet.</p>
                        <p className="text-gray-500 text-sm mt-2">
                            Check back later for expert insights and analysis.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {blogs.map((blog) => (
                            <Link key={blog.id} href={`/blogs/${blog.id}`}>
                                <article className="bg-gray-800 rounded-xl p-6 h-full hover:ring-2 hover:ring-blue-500 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3 mb-4">
                                        {blog.expertImage ? (
                                            <img
                                                src={blog.expertImage}
                                                alt={blog.expertName}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
                                                {blog.expertName.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-medium">{blog.expertName}</p>
                                            <p className="text-sm text-gray-400">{blog.expertDesignation}</p>
                                        </div>
                                    </div>

                                    <h2 className="text-lg font-semibold mb-3 group-hover:text-blue-400 transition line-clamp-2">
                                        {blog.title}
                                    </h2>

                                    <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                                        {blog.content}
                                    </p>

                                    <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-700">
                                        <span>
                                            {new Date(blog.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                        <span className="text-blue-400 group-hover:underline">
                                            Read more →
                                        </span>
                                    </div>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-gray-800 border-t border-gray-700 mt-12">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-gray-400 text-sm">© 2025 Next-StockMarket. All rights reserved.</p>
                            <p className="text-gray-500 text-xs mt-1">
                                Blogs are for educational purposes. Not financial advice.
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <Link href="/" className="text-gray-400 hover:text-white text-sm">
                                Dashboard
                            </Link>
                            {expert ? (
                                <>
                                    <Link href="/expert/write-blog" className="text-green-400 hover:text-green-300 text-sm font-medium">
                                        Write Blog
                                    </Link>
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

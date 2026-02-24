'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Expert {
    id: string;
    name: string;
    email: string;
    designation: string;
    gender: string;
    profileImage: string | null;
}

export default function ExpertProfile() {
    const router = useRouter();
    const [expert, setExpert] = useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        designation: '',
    });
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchExpert();
    }, []);

    const fetchExpert = async () => {
        try {
            const res = await fetch('/api/expert/me');
            const data = await res.json();

            if (data.success) {
                setExpert(data.expert);
                setFormData({
                    name: data.expert.name,
                    designation: data.expert.designation,
                });
            } else {
                router.push('/expert/login');
            }
        } catch (error) {
            router.push('/expert/login');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        setMessage({ type: '', text: '' });

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('designation', formData.designation);
            if (selectedImage) {
                formDataToSend.append('profileImage', selectedImage);
            }

            const res = await fetch('/api/expert/profile', {
                method: 'PUT',
                body: formDataToSend,
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                fetchExpert();
                setSelectedImage(null);
                setImagePreview(null);
            } else {
                setMessage({ type: 'error', text: data.error || 'Update failed' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Something went wrong' });
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        try {
            await fetch('/api/expert/logout', { method: 'GET' });
            router.push('/');
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
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="text-xl font-bold text-blue-400">
                        Next-StockMarket
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/expert/write-blog"
                            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                            ✍️ Write a Blog
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Expert Profile</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <div className="bg-gray-800 rounded-xl p-6 text-center">
                        <div className="mb-4">
                            {imagePreview || expert?.profileImage ? (
                                <img
                                    src={imagePreview || expert?.profileImage || ''}
                                    alt={expert?.name}
                                    className="w-32 h-32 rounded-full mx-auto object-cover"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-4xl font-bold">
                                    {expert?.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-semibold">{expert?.name}</h2>
                        <p className="text-gray-400 text-sm">{expert?.designation}</p>
                        <p className="text-gray-500 text-xs mt-2">{expert?.email}</p>
                        <p className="text-gray-500 text-xs">{expert?.gender}</p>
                    </div>

                    {/* Edit Form */}
                    <div className="md:col-span-2 bg-gray-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Update Profile</h3>

                        {message.text && (
                            <div className={`mb-4 p-3 rounded-lg text-sm ${
                                message.type === 'success' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-red-500/20 text-red-400'
                            }`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Designation</label>
                                <input
                                    type="text"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Profile Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={updating}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition disabled:opacity-50"
                            >
                                {updating ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link href="/expert/write-blog" className="bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition flex items-center gap-4">
                        <span className="text-3xl">✍️</span>
                        <div>
                            <h3 className="font-semibold">Write a Blog</h3>
                            <p className="text-sm text-gray-400">Share your market insights</p>
                        </div>
                    </Link>
                    <Link href="/blogs" className="bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition flex items-center gap-4">
                        <span className="text-3xl">📚</span>
                        <div>
                            <h3 className="font-semibold">View All Blogs</h3>
                            <p className="text-sm text-gray-400">See expert advice collection</p>
                        </div>
                    </Link>
                </div>
            </main>
        </div>
    );
}

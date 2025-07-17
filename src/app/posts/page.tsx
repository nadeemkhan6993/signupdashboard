'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Post {
  _id: string;
  headline: string;
  email: string;
  content: string;
  author: string;
  designation: string;
  authorImage: string | null;
}

export default function ShowPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        if (data.success) {
          setPosts(data.posts);
        }
      } catch (err) {
        console.error('Failed to fetch posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center mt-10">
        <svg
          className="animate-spin h-10 w-10 text-blue-500 mb-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-center text-gray-600">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-white-800">Latest Posts</h1>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">No posts available.</p>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-white shadow-md rounded-xl p-6 flex flex-col sm:flex-row gap-6 hover:shadow-lg transition"
            >
              {post.authorImage ? (
                <Image
                  src={post.authorImage}
                  alt={post.author}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm">
                  No Image
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-800 mb-1">{post.headline}</h2>
                <p className="text-sm text-gray-500 mb-2">
                  By {post.author} {post.designation && `– ${post.designation}`}
                </p>
                <p className="text-gray-700">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

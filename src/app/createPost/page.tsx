'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

function Posts() {
  const [formData, setFormData] = useState({
    headline: '',
    email: '',
    content: '',
    author: '',
    designation: '',
  });
  const [authorImage, setAuthorImage] = useState<File | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAuthorImage(e.target.files[0]);
    }
  };

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const form = new FormData();
    form.append('headline', formData.headline);
    form.append('email', formData.email);
    form.append('content', formData.content);
    form.append('author', formData.author);
    form.append('designation', formData.designation);
    if (authorImage) {
      form.append('authorImage', authorImage);
    }

    try {
      const res = await fetch('/api/createPost', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (res.ok) {
        setResponseMessage('✅ Post created successfully!');
        setFormData({
          headline: '',
          email: '',
          content: '',
          author: '',
          designation: '',
        });
        setAuthorImage(null);

        router.push('/posts');
      } else {
        setResponseMessage(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setResponseMessage('❌ Error submitting form.');
    }
    setLoading(false);
  };
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
        <p className="text-center text-gray-600">Loading...</p>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto mt-12 p-6 bg-white rounded-2xl shadow-lg">
      <h1 className="text-3xl font-semibold text-center text-gray-800 mb-6">Create New Post</h1>

      {responseMessage && (
        <div
          className={`text-sm mb-4 px-4 py-2 rounded ${
            responseMessage.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {responseMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" encType="multipart/form-data">
        <div>
          <label className="block text-sm font-medium text-gray-700">Headline</label>
          <input
            type="text"
            name="headline"
            value={formData.headline}
            onChange={handleChange}
            required
            className="mt-1 w-full text-black p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="mt-1 text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Content</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={4}
            className="mt-1 text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Author</label>
          <input
            type="text"
            name="author"
            value={formData.author}
            onChange={handleChange}
            required
            className="mt-1 text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Designation (Optional)</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            className="mt-1 text-black w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Author Image (Optional)</label>
          <input
            type="file"
            name="authorImage"
            accept="image/*"
            onChange={handleImageChange}
            className="mt-1 w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Submit Post
        </button>
      </form>
    </div>
  );
}


export default Posts
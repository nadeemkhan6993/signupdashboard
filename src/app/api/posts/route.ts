import { connectDB } from '@/dbConnection/dbConnection';
import Post from '@/models/postModel';
import { NextResponse } from 'next/server';

// Connect to MongoDB once
connectDB();

export async function GET() {
  try {
    const posts = await Post.find({}).select('-__v'); // Exclude __v

    // Convert buffer image data to base64 so it can be used in frontend
    const formattedPosts = posts.map((post) => ({
      _id: post._id,
      headline: post.headline,
      email: post.email,
      content: post.content,
      author: post.author,
      designation: post.designation,
      authorImage:
        post.authorImage?.data
          ? `data:${post.authorImage.contentType};base64,${Buffer.from(post.authorImage.data).toString('base64')}`
          : null,
    }));

    return NextResponse.json({ success: true, posts: formattedPosts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

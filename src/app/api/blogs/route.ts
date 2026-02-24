import { connectDB } from '@/dbConnection/dbConnection';
import Blog from '@/models/blogModel';
import Expert from '@/models/expertModel';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Create a new blog post (expert only)
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const token = request.cookies.get("expertToken")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated. Expert login required." },
                { status: 401 }
            );
        }

        const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`));
        const decodedToken: any = jwt.verify(token, tokenSecret!);

        const expert = await Expert.findById(decodedToken.id);
        if (!expert) {
            return NextResponse.json(
                { error: "Expert not found" },
                { status: 404 }
            );
        }

        const requestBody = await request.json();
        const { title, content } = requestBody;

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        const newBlog = new Blog({
            title,
            content,
            expertId: expert._id,
            expertName: expert.name,
            expertDesignation: expert.designation,
            expertImage: expert.profileImage
        });

        const savedBlog = await newBlog.save();

        return NextResponse.json({
            message: "Blog published successfully.",
            success: true,
            blog: {
                id: savedBlog._id,
                title: savedBlog.title,
                expertName: savedBlog.expertName,
                createdAt: savedBlog.createdAt
            }
        });

    } catch (error: any) {
        console.error('Create Blog Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

// Get all blogs (public)
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');
        const skip = (page - 1) * limit;

        const blogs = await Blog.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-__v');

        const total = await Blog.countDocuments();

        const formattedBlogs = blogs.map((blog) => ({
            id: blog._id,
            title: blog.title,
            content: blog.content,
            expertName: blog.expertName,
            expertDesignation: blog.expertDesignation,
            expertImage: blog.expertImage?.data
                ? `data:${blog.expertImage.contentType};base64,${Buffer.from(blog.expertImage.data).toString('base64')}`
                : null,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        }));

        return NextResponse.json({
            success: true,
            blogs: formattedBlogs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Get Blogs Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

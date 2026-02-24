import { connectDB } from '@/dbConnection/dbConnection';
import Blog from '@/models/blogModel';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        const blog = await Blog.findById(id).select('-__v');

        if (!blog) {
            return NextResponse.json(
                { error: "Blog not found" },
                { status: 404 }
            );
        }

        const formattedBlog = {
            id: blog._id,
            title: blog.title,
            content: blog.content,
            expertId: blog.expertId,
            expertName: blog.expertName,
            expertDesignation: blog.expertDesignation,
            expertImage: blog.expertImage?.data
                ? `data:${blog.expertImage.contentType};base64,${Buffer.from(blog.expertImage.data).toString('base64')}`
                : null,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt
        };

        return NextResponse.json({
            success: true,
            blog: formattedBlog
        });

    } catch (error: any) {
        console.error('Get Blog Error:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

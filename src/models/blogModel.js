import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Please provide a title for the blog."],
    },
    content: {
        type: String,
        required: [true, "Please provide content for the blog."],
    },
    expertId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'experts',
        required: [true, "Expert ID is required."]
    },
    expertName: {
        type: String,
        required: [true, "Expert name is required."]
    },
    expertDesignation: {
        type: String,
        required: false,
        default: "Market Expert"
    },
    expertImage: {
        data: Buffer,
        contentType: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Blog = mongoose.models.blogs || mongoose.model("blogs", blogSchema);

export default Blog;

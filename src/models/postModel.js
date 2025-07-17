import mongoose from "mongoose";


const postSchema = new mongoose.Schema({
    headline: {
        type: String,
        required: [true, "Please provide a Headline for the post."],
        unique: [true, "Please provide other headline as this is already taken."]
    },
    email: {
        type: String,
        required: [true, "Please provide an email."],
        unique: false
    },
    content: {
        type: String,
        required: [true, "Please provide content for the post."],
        unique: false
    },
    author: {
        type: String,
        required: [true, "Please provide your name."],
        unique: false
    },
    designation: {
        type: String,
        required: false,
        default: "Anonymous",
        unique: false
    },
    authorImage: {
        data: Buffer,
        contentType: String
    }
})

const Posts = mongoose.models.posts || mongoose.model("posts", postSchema)

export default Posts;
import mongoose from "mongoose";

const expertSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide your name."],
    },
    email: {
        type: String,
        required: [true, "Please provide an email."],
        unique: [true, "This email is already registered."]
    },
    password: {
        type: String,
        required: [true, "Please provide a password."],
    },
    designation: {
        type: String,
        required: [true, "Please provide your designation."],
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: [true, "Please provide your gender."],
    },
    profileImage: {
        data: Buffer,
        contentType: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Expert = mongoose.models.experts || mongoose.model("experts", expertSchema);

export default Expert;

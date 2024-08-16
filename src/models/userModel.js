import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: [true, "Please provide a userName."],
        unique: [true, "Please provide other userName as this is already taken."]
    },
    email: {
        type: String,
        required: [true, "Please provide an email."],
        unique: [true, "Please provide other email as this is already taken."]
    },
    password: {
        type: String,
        required: [true, "Please provide a password."],
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,

})

const User = mongoose.models.users || mongoose.model("users", userSchema)

export default User;
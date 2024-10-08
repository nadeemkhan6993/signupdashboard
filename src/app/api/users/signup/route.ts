import { connectDB } from '@/dbConnection/dbConnection'
import User from "@/models/userModel"
import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from "bcryptjs"
import { sendMail } from '@/helpers/mailHelper'


connectDB()

export async function POST (request: NextRequest){
    try {
        const requestBody = await request.json()
        const {userName, email, password} = requestBody
        //validation
        console.log(requestBody)

        const user = await User.findOne({email})

        if(user){
            return NextResponse.json({error: "User already exists."}, {status: 400})
        }
        
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt)

        const newUser = new User({
            userName,
            email,
            password : hashedPassword
        })

        const savedUser = await newUser.save()
        console.log(savedUser)

        //send email verification
        await sendMail({email, emailType: "VERIFY", userID: savedUser._id})
        return NextResponse.json({
            message: "User registered Successfully.",
            success: true,
            savedUser
        })

    } catch (error : any) {
        return NextResponse.json({error : error.message}, {status: 500})
    }
}
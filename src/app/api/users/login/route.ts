import { connectDB } from '@/dbConnection/dbConnection'
import User from "@/models/userModel"
import bcryptjs from "bcryptjs"
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'


connectDB()

export async function POST (request: NextRequest){
    try {
        const requestBody = await request.json()
        const {email, password} = requestBody
        //validation
        console.log(requestBody)

        const user = await User.findOne({email})

        if(!user){
            return NextResponse.json({error: "User does not exists."}, {status: 400})
        }

        const validPassword = await bcryptjs.compare(password, user.password)

        if(!validPassword){
            return NextResponse.json({error: "Check your credentials."}, {status: 400})
        }

        const tokenData = {
            id: user._id,
            username: user.username,
            email: user.email
        }

        const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`))

        const token = jwt.sign(tokenData, tokenSecret!, {expiresIn : '1d'})

        const response = NextResponse.json({
            message: "Logged in success.",
            success: true
        })

        response.cookies.set("token", token, {httpOnly: true})

        return response

    } catch (error : any) {
        return NextResponse.json({error : error.message}, {status: 500})
    }
}
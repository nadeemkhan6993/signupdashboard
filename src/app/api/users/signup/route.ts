import { connectDB } from '@/dbConnection/dbConnection'
import User from "@/models/userModel"
import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from "bcryptjs"


connectDB()

export async function POST (request: NextRequest){
    try {
        const requestBody = request.json()
        const {userName, email, password} = requestBody
        //validation
        console.log(requestBody)

        const user = await User.findOne({email})

        if(user){
            return NextResponse.json({error: "User already exists."}, {status: 400})
        }
        
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt)

    } catch (error : any) {
        return NextResponse.json({error : error.message}, {status: 500})
    }
}
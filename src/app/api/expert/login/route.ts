import { connectDB } from '@/dbConnection/dbConnection'
import Expert from "@/models/expertModel"
import bcryptjs from "bcryptjs"
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const requestBody = await request.json()
        const { email, password } = requestBody

        // Find expert
        const expert = await Expert.findOne({ email })
        if (!expert) {
            return NextResponse.json(
                { error: "Expert account not found." },
                { status: 400 }
            )
        }

        // Verify password
        const validPassword = await bcryptjs.compare(password, expert.password)
        if (!validPassword) {
            return NextResponse.json(
                { error: "Invalid credentials." },
                { status: 400 }
            )
        }

        // Create token data
        const tokenData = {
            id: expert._id,
            name: expert.name,
            email: expert.email,
            designation: expert.designation,
            isExpert: true
        }

        const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`))
        const token = jwt.sign(tokenData, tokenSecret!, { expiresIn: '7d' })

        const response = NextResponse.json({
            message: "Login successful.",
            success: true,
            expert: {
                id: expert._id,
                name: expert.name,
                email: expert.email,
                designation: expert.designation
            }
        })

        response.cookies.set("expertToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 // 7 days
        })

        return response

    } catch (error: any) {
        console.error('Expert Login Error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

import { connectDB } from '@/dbConnection/dbConnection'
import Expert from "@/models/expertModel"
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const token = request.cookies.get("expertToken")?.value

        if (!token) {
            return NextResponse.json(
                { error: "Not authenticated" },
                { status: 401 }
            )
        }

        const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`))
        const decodedToken: any = jwt.verify(token, tokenSecret!)

        const expert = await Expert.findById(decodedToken.id).select("-password")

        if (!expert) {
            return NextResponse.json(
                { error: "Expert not found" },
                { status: 404 }
            )
        }

        // Convert profile image to base64 if exists
        let profileImageUrl = null
        if (expert.profileImage?.data) {
            profileImageUrl = `data:${expert.profileImage.contentType};base64,${Buffer.from(expert.profileImage.data).toString('base64')}`
        }

        return NextResponse.json({
            success: true,
            expert: {
                id: expert._id,
                name: expert.name,
                email: expert.email,
                designation: expert.designation,
                gender: expert.gender,
                profileImage: profileImageUrl,
                createdAt: expert.createdAt
            }
        })

    } catch (error: any) {
        console.error('Expert Me Error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

import { connectDB } from '@/dbConnection/dbConnection'
import Expert from "@/models/expertModel"
import { NextRequest, NextResponse } from 'next/server'
import bcryptjs from "bcryptjs"

const EXPERT_SECRET_CODE = 'ZBK897';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const requestBody = await request.json()
        const { name, email, password, designation, gender, secretCode } = requestBody

        // Validate secret code
        if (secretCode !== EXPERT_SECRET_CODE) {
            return NextResponse.json(
                { error: "Invalid secret code. Access denied." },
                { status: 403 }
            )
        }

        // Check if expert already exists
        const existingExpert = await Expert.findOne({ email })
        if (existingExpert) {
            return NextResponse.json(
                { error: "An expert with this email already exists." },
                { status: 400 }
            )
        }

        // Hash password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        // Create new expert (normalize gender to lowercase)
        const newExpert = new Expert({
            name,
            email,
            password: hashedPassword,
            designation,
            gender: gender?.toLowerCase()
        })

        const savedExpert = await newExpert.save()

        return NextResponse.json({
            message: "Expert registered successfully.",
            success: true,
            expert: {
                id: savedExpert._id,
                name: savedExpert.name,
                email: savedExpert.email,
                designation: savedExpert.designation
            }
        })

    } catch (error: any) {
        console.error('Expert Signup Error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

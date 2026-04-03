import { NextResponse } from 'next/server'

function buildLogoutResponse() {
    const response = NextResponse.json({
        message: "Logout successful.",
        success: true
    })
    response.cookies.set("expertToken", "", {
        httpOnly: true,
        expires: new Date(0)
    })
    return response
}

export async function GET() {
    try {
        return buildLogoutResponse()
    } catch (error: any) {
        console.error('Expert Logout Error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

// POST alias — several client pages call logout with method: 'POST'
export async function POST() {
    try {
        return buildLogoutResponse()
    } catch (error: any) {
        console.error('Expert Logout Error:', error)
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        )
    }
}

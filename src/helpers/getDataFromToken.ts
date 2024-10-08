import { NextRequest } from "next/server";
import jwt from 'jsonwebtoken'
import { request } from "http";


export const getDataFromToken = (request: NextRequest) => {
    try {
        const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`))
        const token = request.cookies.get("token")?.value || "";
        const decodedToken : any = jwt.verify(token, tokenSecret!)
        return decodedToken.id
    } catch (error: any) {
        throw new Error(error.message)
    }
}
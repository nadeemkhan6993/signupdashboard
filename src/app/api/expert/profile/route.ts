import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import { connectDB } from '@/dbConnection/dbConnection';
import Expert from '@/models/expertModel';
import type { Fields, Files, File } from 'formidable';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        await connectDB();
        // Get expert token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('expertToken')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const tokenSecret = decodeURIComponent(atob(`${process.env.TOKEN_SECRET}`));
        const decodedToken: any = jwt.verify(token, tokenSecret!);
        const expertId = decodedToken.id;

        const form = formidable({ multiples: false, keepExtensions: true });

        const nodeReq = Object.assign(
            formIncomingMessageFromRequest(req),
            { headers: Object.fromEntries(req.headers.entries()), method: req.method }
        );

        const response = await new Promise<NextResponse>(resolve => {
            form.parse(nodeReq, async (err: any, fields: Fields, files: Files) => {
                if (err) {
                    console.error('Formidable parse error:', err);
                    return resolve(NextResponse.json({ error: 'Form parse error' }, { status: 400 }));
                }

                try {
                    const { name, designation } = fields;
                    const file = (files.profileImage && Array.isArray(files.profileImage) ? files.profileImage[0] : undefined) as File | undefined;

                    const updateData: any = {};

                    if (name) {
                        updateData.name = Array.isArray(name) ? name[0] : name;
                    }
                    if (designation) {
                        updateData.designation = Array.isArray(designation) ? designation[0] : designation;
                    }
                    if (file) {
                        const imageBuffer = fs.readFileSync(file.filepath);
                        updateData.profileImage = {
                            data: imageBuffer,
                            contentType: file.mimetype
                        };
                    }

                    const updatedExpert = await Expert.findByIdAndUpdate(
                        expertId,
                        updateData,
                        { new: true }
                    ).select('-password');

                    if (!updatedExpert) {
                        return resolve(NextResponse.json({ error: 'Expert not found' }, { status: 404 }));
                    }

                    let profileImageUrl = null;
                    if (updatedExpert.profileImage?.data) {
                        profileImageUrl = `data:${updatedExpert.profileImage.contentType};base64,${Buffer.from(updatedExpert.profileImage.data).toString('base64')}`;
                    }

                    return resolve(
                        NextResponse.json({
                            message: 'Profile updated successfully.',
                            success: true,
                            expert: {
                                id: updatedExpert._id,
                                name: updatedExpert.name,
                                email: updatedExpert.email,
                                designation: updatedExpert.designation,
                                gender: updatedExpert.gender,
                                profileImage: profileImageUrl
                            }
                        })
                    );
                } catch (error: any) {
                    console.error('Error updating profile:', error);
                    return resolve(NextResponse.json({ error: error.message }, { status: 500 }));
                }
            });
        });

        return response;

    } catch (error: any) {
        console.error('Profile Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT is an alias for POST (profile update via form)
export async function PUT(req: Request) {
    return POST(req);
}

function formIncomingMessageFromRequest(req: Request): IncomingMessage {
    const readable = Readable.fromWeb(req.body as any);
    const incoming = Object.assign(readable, {
        headers: Object.fromEntries(req.headers.entries()),
        method: req.method,
        url: '',
        socket: {} as any,
    });
    return incoming as IncomingMessage;
}

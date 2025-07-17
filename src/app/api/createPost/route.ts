import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import { connectDB } from '@/dbConnection/dbConnection';
import Post from '@/models/postModel';
import type { Fields, Files, File } from 'formidable';
import { Readable } from 'stream';
import { IncomingMessage } from 'http';

// Disable Next.js default body parsing
export const dynamic = 'force-dynamic';

// Connect to DB once
connectDB();

export async function POST(req: Request) {
  const form = formidable({ multiples: false, keepExtensions: true });

  // Convert the web stream to a Node.js readable stream
  const nodeReq = Object.assign(
    formIncomingMessageFromRequest(req),
    { headers: Object.fromEntries(req.headers.entries()), method: req.method }
  );

  // Wrap formidable parse in a Promise so we can await it and return a response
  const response = await new Promise<NextResponse>(resolve => {
    form.parse(nodeReq, async (err: any, fields: Fields, files: Files) => {
      if (err) {
        console.error('Formidable parse error:', err);
        return resolve(NextResponse.json({ error: 'Form parse error' }, { status: 400 }));
      }

      try {
        const { headline, email, content, author, designation } = fields;
        const file = (files.authorImage && Array.isArray(files.authorImage) ? files.authorImage[0] : undefined) as File | undefined;

        // Check if headline already exists
        const existingPost = await Post.findOne({ headline });
        if (existingPost) {
          return resolve(
            NextResponse.json(
              { error: 'Post with this headline already exists.' },
              { status: 400 }
            )
          );
        }

        // Prepare image buffer
        const imageBuffer: Buffer | null = file ? fs.readFileSync(file.filepath) : null;

        // Create new post
        const newPost = new Post({
          headline: Array.isArray(headline) ? headline[0] : headline,
          email: Array.isArray(email) ? email[0] : email,
          content: Array.isArray(content) ? content[0] : content,
          author: Array.isArray(author) ? author[0] : author,
          designation: (Array.isArray(designation) ? designation[0] : designation) || 'Anonymous',
          authorImage: imageBuffer && file
            ? {
                data: imageBuffer,
                contentType: file.mimetype,
              }
            : undefined,
        });

        const savedPost = await newPost.save();

        return resolve(
          NextResponse.json({
            message: 'Post created successfully.',
            success: true,
            savedPost,
          })
        );
      } catch (error: any) {
        console.error('Error saving post:', error);
        return resolve(NextResponse.json({ error: error.message }, { status: 500 }));
      }
    });
  });

  return response;
}
function formIncomingMessageFromRequest(req: Request): IncomingMessage {
    // Create a Readable stream from the web stream
    const readable = Readable.fromWeb(req.body as any);

    // Create a minimal IncomingMessage mock
    const incoming = Object.assign(readable, {
        headers: Object.fromEntries(req.headers.entries()),
        method: req.method,
        url: '', // Not used by formidable in this context
        socket: {} as any, // Required by IncomingMessage, but not used
    });

    return incoming as IncomingMessage;
}


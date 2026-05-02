import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cache = null;

export async function GET() {
    if (cache) {
        return NextResponse.json(cache, {
            headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
        });
    }

    const filePath = path.join(process.cwd(), 'supported.json');

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        cache = JSON.parse(fileContents);
        return NextResponse.json(cache, {
            headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Supported languages file not found' }, { status: 404 });
    }
}

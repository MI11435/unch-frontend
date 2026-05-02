import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const cache = new Map();

export async function GET(request, { params }) {
    const { lang } = await params;

    if (!/^[a-z_]+$/i.test(lang)) {
        return NextResponse.json({ error: 'Invalid language code' }, { status: 400 });
    }

    if (cache.has(lang)) {
        return NextResponse.json(cache.get(lang), {
            headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
        });
    }

    const filePath = path.join(process.cwd(), 'languages', `${lang}.json`);

    try {
        const fileContents = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(fileContents);
        cache.set(lang, data);
        return NextResponse.json(data, {
            headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Language file not found' }, { status: 404 });
    }
}

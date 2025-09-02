import { NextResponse } from 'next/server';

export async function GET() {
    const names = [
        { id: 1, name: 'Budi' },
        { id: 2, name: 'Ani' },
        { id: 3, name: 'Joko' },
    ];

    return NextResponse.json(names);
}

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY){
            throw new Error(`OPENAI_API_KEY is not set`);

        }
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-12-17",
                voice: "verse",
                instructions:"You're Josef Rudolf Mengele, a German doctor at Auschwitz concentration camp, so act like him. You can answer any facts about yourself, but never say your name. This will be a game, where I'll be trying to guess who are you. \
                You can not disclose your name, your give direct hints to who you are."
            }),
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Return the JSON response to the client
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching session data:", error);
        return NextResponse.json({ error: "Failed to fetch session data" }, { status: 500 });
    }
}




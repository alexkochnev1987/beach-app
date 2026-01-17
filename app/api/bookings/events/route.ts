
import { NextRequest } from 'next/server';
import { eventManager } from '@/lib/events';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const stream = new ReadableStream({
        start(controller) {
            const encoder = new TextEncoder();

            const sendEvent = (data: any) => {
                const message = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            // Subscribe to events
            const unsubscribe = eventManager.subscribe((data) => {
                sendEvent(data);
            });

            // Keep connection alive
            const keepAlive = setInterval(() => {
                controller.enqueue(encoder.encode(': keep-alive\n\n'));
            }, 30000);

            req.signal.onabort = () => {
                unsubscribe();
                clearInterval(keepAlive);
                controller.close();
            };
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
        },
    });
}

export const config = { runtime: 'edge' };

export default function handler() {
    return new Response(JSON.stringify({ status: 'ok', env: !!process.env.OTAKUDESU_URL }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

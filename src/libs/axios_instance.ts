const defaultHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
};

export async function fetchText(url: string): Promise<string> {
    const res = await fetch(url, {
        headers: defaultHeaders,
        signal: AbortSignal.timeout(10000)
    });
    return res.text();
}

export async function fetchPost(url: string, body: URLSearchParams): Promise<any> {
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            ...defaultHeaders,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        signal: AbortSignal.timeout(10000)
    });
    return res.json();
}

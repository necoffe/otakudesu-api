const http = require('http');
const url = require('url');

// Import all API handlers
const homeHandler = require('./api/home');
const animeListHandler = require('./api/anime-list');
const animeDetailHandler = require('./api/anime/[slug]');
const episodeDetailHandler = require('./api/episode/[slug]');
const ongoingHandler = require('./api/ongoing');
const searchHandler = require('./api/search');
const genresHandler = require('./api/genres');
const genreDetailHandler = require('./api/genre/[slug]');

const PORT = process.env.PORT || 3000;

// Add Express-like methods to native http response
function wrapResponse(res) {
    let statusCode = 200;

    res.status = (code) => {
        statusCode = code;
        return res;
    };

    res.json = (data) => {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
        return res;
    };

    // Keep original setHeader working
    const originalSetHeader = res.setHeader.bind(res);
    res.setHeader = (key, value) => {
        originalSetHeader(key, value);
        return res;
    };

    return res;
}

const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname.replace(/\/$/, '') || '/';

    // Add Express-like methods
    wrapResponse(res);

    // Attach query parsing to req
    req.query = parsedUrl.query || {};

    // CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    try {
        // Route matching
        if (pathname === '/' || pathname === '/api/home') {
            await homeHandler(req, res);
        } else if (pathname === '/api/anime-list') {
            await animeListHandler(req, res);
        } else if (pathname.startsWith('/api/anime/')) {
            const slug = pathname.replace('/api/anime/', '');
            req.query.slug = slug;
            await animeDetailHandler(req, res);
        } else if (pathname.startsWith('/api/episode/')) {
            const slug = pathname.replace('/api/episode/', '');
            req.query.slug = slug;
            await episodeDetailHandler(req, res);
        } else if (pathname === '/api/ongoing') {
            await ongoingHandler(req, res);
        } else if (pathname === '/api/search') {
            await searchHandler(req, res);
        } else if (pathname === '/api/genres') {
            await genresHandler(req, res);
        } else if (pathname.startsWith('/api/genre/')) {
            const slug = pathname.replace('/api/genre/', '');
            req.query.slug = slug;
            await genreDetailHandler(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: false,
                message: 'Endpoint not found',
                endpoints: {
                    home: '/api/home',
                    animeList: '/api/anime-list',
                    animeDetail: '/api/anime/:slug',
                    episodeDetail: '/api/episode/:slug',
                    ongoing: '/api/ongoing?page=1',
                    search: '/api/search?q=keyword',
                    genres: '/api/genres',
                    genreAnime: '/api/genre/:slug?page=1',
                }
            }));
        }
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: false, message: error.message }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 OtakuDesu API running at http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET /api/home                 - Homepage (ongoing + complete)`);
    console.log(`  GET /api/anime-list           - Full anime list A-Z`);
    console.log(`  GET /api/anime/:slug          - Anime detail`);
    console.log(`  GET /api/episode/:slug        - Episode detail + downloads`);
    console.log(`  GET /api/ongoing?page=1       - Ongoing anime`);
    console.log(`  GET /api/search?q=keyword     - Search anime`);
    console.log(`  GET /api/genres               - All genres`);
    console.log(`  GET /api/genre/:slug?page=1   - Anime by genre`);
});

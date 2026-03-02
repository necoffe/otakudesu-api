import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import homeRoute from '../src/routes/home';
import animeListRoute from '../src/routes/anime_list';
import animeRoute from '../src/routes/anime';
import releaseScheduleRoute from '../src/routes/release_schedule';
import genreRoute from '../src/routes/genre_list';
import ongoingRoute from '../src/routes/ongoing';
import completeRoute from '../src/routes/complete';

export const runtime = 'nodejs';

const app = new Hono().basePath('/api');

app.use('/*', cors());

app.route('/home', homeRoute);
app.route('/anime-list', animeListRoute);
app.route('/anime', animeRoute);
app.route('/release-schedule', releaseScheduleRoute);
app.route('/genre-list', genreRoute);
app.route('/ongoing-anime', ongoingRoute);
app.route('/complete-anime', completeRoute);

app.get('/', (c) => {
    return c.json({
        message: 'Welcome to Otakudesu API',
        routes: {
            home: '/api/home',
            anime_list: '/api/anime-list',
            anime_detail: '/api/anime/:slug',
            anime_search: '/api/anime/search?q=',
            episode: '/api/anime/episode/:eps',
            batch: '/api/anime/batch/:slug',
            release_schedule: '/api/release-schedule',
            genre_list: '/api/genre-list',
            ongoing_anime: '/api/ongoing-anime/:page',
            complete_anime: '/api/complete-anime/:page'
        }
    });
});

export default handle(app);
export const GET = handle(app);
export const POST = handle(app);

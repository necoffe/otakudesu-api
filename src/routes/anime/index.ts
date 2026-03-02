import { Hono } from "hono";
import { fetchText, fetchPost } from "../../libs/axios_instance";
import { load } from "cheerio";
import { detailAnime, detailEps } from "../../libs/scrape_detail_anime";
import { searchAnime } from "../../libs/scrape_search_anime";
import { batchAnime } from "../../libs/scrape_batch";

const animeRoute = new Hono();

animeRoute.get('/search', async (c) => {
    const { q } = c.req.query();
    if (!q) {
        return c.json({
            message: "Query not found"
        }, 404);
    };

    const data = await fetchText(`${process.env.OTAKUDESU_URL}/?s=${q}&post_type=anime`);
    const $ = load(data);

    const searchScrape = $('.vezone .venser .venutama .page .chivsrc li').toString();
    const searchResult = searchAnime(searchScrape);
    if (searchResult.length == 0) {
        return c.json({
            message: 'Anime not found'
        });
    };

    return c.json(searchResult, 200);
});

animeRoute.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const data = await fetchText(`${process.env.OTAKUDESU_URL}/anime/${slug}`);
    const $ = load(data);

    const detailAnimeScrape = $('.venser .fotoanime').toString();
    const batchAnimeScrape = $('.venser .episodelist:first ul li').toString()
    const fullDownloadAnimeScrape = $('.venser .episodelist:last ul li').toString()
    const episodeListAnimeScrape = $('.venser .episodelist:eq(1) ul li').toString()
    if (!detailAnimeScrape) {
        return c.json({
            message: 'Anime not found'
        }, 404);
    }
    const detailAnimeResult = detailAnime(
        detailAnimeScrape,
        batchAnimeScrape,
        fullDownloadAnimeScrape,
        episodeListAnimeScrape
    );

    return c.json(detailAnimeResult, 200);
});

animeRoute.get('/episode/:eps', async (c) => {
    const { eps } = c.req.param();
    const data = await fetchText(`${process.env.OTAKUDESU_URL}/episode/${eps}`);
    const $ = load(data);

    const detailEpsScrape = $('#venkonten .venser').toString();
    if (!detailEpsScrape) {
        return c.json({
            message: 'Episode not found'
        }, 404);
    };
    const detailEpsResult = detailEps(detailEpsScrape);

    // Resolve mirror stream URLs
    const baseUrl = process.env.OTAKUDESU_URL || '';
    const ajaxUrl = `${baseUrl}/wp-admin/admin-ajax.php`;
    const resolvedMirrors = [];

    if (detailEpsResult.mirror_streams.length > 0) {
        try {
            // Get nonce first
            const nonceRes = await fetchPost(ajaxUrl, new URLSearchParams({
                action: 'aa1208d27f29ca340c92c66d1926f13f'
            }));
            const nonce = nonceRes?.data;

            // Resolve each mirror
            for (const mirror of detailEpsResult.mirror_streams) {
                try {
                    const decoded = JSON.parse(atob(mirror.data_content));
                    const mirrorRes = await fetchPost(ajaxUrl, new URLSearchParams({
                        id: decoded.id,
                        i: decoded.i,
                        q: decoded.q,
                        nonce,
                        action: '2a3505c93b0035d3f455df82bf976b84'
                    }));
                    const html = atob(mirrorRes?.data || '');
                    const $mirror = load(html);
                    const streamUrl = $mirror('iframe').attr('src') || null;
                    resolvedMirrors.push({
                        quality: mirror.quality,
                        provider: mirror.provider,
                        stream_url: streamUrl
                    });
                } catch {
                    resolvedMirrors.push({
                        quality: mirror.quality,
                        provider: mirror.provider,
                        stream_url: null
                    });
                }
            }
        } catch {
            // nonce fetch failed, return empty mirrors
        }
    }

    const { mirror_streams, ...result } = detailEpsResult;
    return c.json({ ...result, mirror_streams: resolvedMirrors }, 200);
});

animeRoute.get('/batch/:slug', async (c) => {
    const { slug } = c.req.param();
    const data = await fetchText(`${process.env.OTAKUDESU_URL}/batch/${slug}`);
    const $ = load(data);

    const animeScrape = $('#venkonten .venser').toString();
    if (!animeScrape) {
        return c.json({
            message: 'Batch anime not found'
        }, 404);
    };
    const animeResult = batchAnime(animeScrape);

    return c.json(animeResult, 200);
});

export default animeRoute;

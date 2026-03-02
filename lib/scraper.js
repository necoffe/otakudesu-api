const cheerio = require('cheerio');
const cloudscraper = require('cloudscraper');

const BASE_URL = 'https://otakudesu.best';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Helper function to fetch page with cloudscraper (bypasses Cloudflare)
async function fetchPage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const html = await cloudscraper.get({
                uri: url,
                headers: {
                    'User-Agent': getRandomUserAgent(),
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Referer': BASE_URL + '/',
                    'Cache-Control': 'max-age=0',
                    'Upgrade-Insecure-Requests': '1',
                },
                timeout: 15000 // 15s timeout
            });

            return cheerio.load(html);
        } catch (error) {
            console.error(`Attempt ${i + 1} failed for ${url}: ${error.message}`);
            if (i === retries - 1) {
                // Return an empty cheerio object so it doesn't crash the server
                return cheerio.load('<html><body></body></html>');
            }
            // Retrying
            await new Promise(r => setTimeout(r, 2000 + (Math.random() * 2000)));
        }
    }
}

function extractSlug(url) {
    if (!url) return '';
    const parts = url.replace(/\/$/, '').split('/');
    return parts[parts.length - 1] || '';
}

// ============== HOME PAGE ==============
async function scrapeHome() {
    const $ = await fetchPage(BASE_URL);

    const ongoing = [];
    $('.venz ul li').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.jdlflm').text().trim();
        const url = $el.find('.thumb a').attr('href') || '';
        const poster = $el.find('.thumb img').attr('src') || '';
        const episode = $el.find('.epz').text().trim();
        const day = $el.find('.epztipe').text().trim();
        const date = $el.find('.newnime').text().trim();
        const slug = extractSlug(url);

        if (title) {
            ongoing.push({ title, slug, poster, episode, day, date, url });
        }
    });

    const complete = [];
    $('.rseries .venz ul li, .completed .venz ul li').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.jdlflm').text().trim();
        const url = $el.find('.thumb a').attr('href') || '';
        const poster = $el.find('.thumb img').attr('src') || '';
        const episode = $el.find('.epz').text().trim();
        const date = $el.find('.newnime').text().trim();
        const slug = extractSlug(url);

        if (title && !ongoing.find(a => a.slug === slug)) {
            complete.push({ title, slug, poster, episode, date, url });
        }
    });

    return { ongoing, complete };
}

// ============== ANIME LIST (A-Z) ==============
async function scrapeAnimeList() {
    const $ = await fetchPage(`${BASE_URL}/anime-list/`);

    const animeList = [];
    $('.daftarkartun .bariskel498 .jdlbar').each((_, el) => {
        const $el = $(el);
        const $a = $el.find('a');
        const title = $a.text().trim();
        const url = $a.attr('href') || '';
        const slug = extractSlug(url);

        if (title) {
            animeList.push({ title, slug, url });
        }
    });

    // fallback: try alternative selectors
    if (animeList.length === 0) {
        $('.animelist a, .daftarkartun a, .blix ul li a').each((_, el) => {
            const $el = $(el);
            const title = $el.text().trim();
            const url = $el.attr('href') || '';
            const slug = extractSlug(url);

            if (title && url.includes('/anime/') && !animeList.find(a => a.slug === slug)) {
                animeList.push({ title, slug, url });
            }
        });
    }

    return animeList;
}

// ============== ANIME DETAIL ==============
async function scrapeAnimeDetail(slug) {
    const $ = await fetchPage(`${BASE_URL}/anime/${slug}/`);

    const title = $('.infozingle .infozin .spe span:contains("Judul")').parent().text().replace('Judul:', '').trim() ||
        $('h1.entry-title').text().replace('Subtitle Indonesia', '').trim() ||
        $('.jdlrx h1').text().replace('Subtitle Indonesia', '').trim();

    const infoFields = {};
    $('.infozingle .spe span, .infozin .spe span').each((_, el) => {
        const text = $(el).parent().text().trim();
        const colonIndex = text.indexOf(':');
        if (colonIndex > -1) {
            const key = text.substring(0, colonIndex).trim().toLowerCase();
            const value = text.substring(colonIndex + 1).trim();
            infoFields[key] = value;
        }
    });

    const genres = [];
    $('.infozingle .genrespt a, .infozin .genrespt a, .infozingle .spe span:contains("Genre") a, .infozin .spe span:contains("Genre") a').each((_, el) => {
        const genre = $(el).text().trim();
        const genreUrl = $(el).attr('href') || '';
        const genreSlug = extractSlug(genreUrl);
        if (genre) {
            genres.push({ name: genre, slug: genreSlug });
        }
    });

    // Fallback for genres from text
    if (genres.length === 0) {
        $('a[href*="/genres/"]').each((_, el) => {
            const genre = $(el).text().trim();
            const genreUrl = $(el).attr('href') || '';
            const genreSlug = extractSlug(genreUrl);
            if (genre && !genres.find(g => g.slug === genreSlug)) {
                genres.push({ name: genre, slug: genreSlug });
            }
        });
    }

    const synopsis = $('.sinopc p').text().trim() || $('.entry-content-single p').text().trim() || '';
    const poster = $('.fotoanime img').attr('src') || '';

    const episodes = [];
    $('.episodelist ul li').each((_, el) => {
        const $el = $(el);
        const $a = $el.find('a');
        const epTitle = $a.text().trim();
        const epUrl = $a.attr('href') || '';
        const epSlug = extractSlug(epUrl);
        const epDate = $el.find('.zemark').text().trim();

        if (epTitle) {
            episodes.push({ title: epTitle, slug: epSlug, date: epDate, url: epUrl });
        }
    });

    return {
        title: title || infoFields['judul'] || '',
        japanese: infoFields['japanese'] || '',
        score: infoFields['skor'] || '',
        producer: infoFields['produser'] || '',
        type: infoFields['tipe'] || '',
        status: infoFields['status'] || '',
        totalEpisode: infoFields['total episode'] || '',
        duration: infoFields['durasi'] || '',
        releaseDate: infoFields['tanggal rilis'] || '',
        studio: infoFields['studio'] || '',
        genres,
        synopsis,
        poster,
        episodes: episodes.reverse(),
    };
}

// ============== EPISODE DETAIL ==============
async function scrapeEpisodeDetail(slug) {
    const $ = await fetchPage(`${BASE_URL}/episode/${slug}/`);

    const title = $('h1.entry-title').text().trim() ||
        $('h1.posttl').text().trim() ||
        $('.vemark h1').text().trim() || '';

    // Get see all episodes link for anime slug
    const allEpisodesLink = $('a:contains("See All Episodes"), a:contains("Lihat Semua")').attr('href') || '';
    const animeSlug = extractSlug(allEpisodesLink);

    // Streaming servers
    const streamingServers = [];
    $('.mirrorstream ul li a, .responsive-video-container iframe').each((_, el) => {
        const $el = $(el);
        const serverName = $el.text().trim();
        const serverUrl = $el.attr('data-content') || $el.attr('src') || $el.attr('href') || '';
        if (serverName && serverName !== '') {
            streamingServers.push({ name: serverName, url: serverUrl });
        }
    });

    // Download links
    const downloads = [];
    $('.download ul li, .unduh ul li').each((_, el) => {
        const $el = $(el);
        const resText = $el.find('strong').text().trim();

        const links = {};
        $el.find('a').each((_, linkEl) => {
            const linkName = $(linkEl).text().trim();
            const linkUrl = $(linkEl).attr('href') || '';
            if (linkName && linkUrl) {
                links[linkName] = linkUrl;
            }
        });

        const sizeMatch = $el.text().match(/(\d+[\.,]?\d*\s*[KMGT]?B)/i);
        const size = sizeMatch ? sizeMatch[1] : '';

        if (resText || Object.keys(links).length > 0) {
            downloads.push({
                resolution: resText,
                size,
                links,
            });
        }
    });

    // Navigation
    const prevEp = $('a:contains("Previous Eps")').attr('href') || '';
    const nextEp = $('a:contains("Next Eps")').attr('href') || '';

    return {
        title,
        animeSlug,
        prevEpisode: extractSlug(prevEp),
        nextEpisode: extractSlug(nextEp),
        streamingServers,
        downloads,
    };
}

// ============== ONGOING ==============
async function scrapeOngoing(page = 1) {
    const url = page > 1 ? `${BASE_URL}/ongoing-anime/page/${page}/` : `${BASE_URL}/ongoing-anime/`;
    const $ = await fetchPage(url);

    const animeList = [];
    $('.venz ul li').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.jdlflm').text().trim();
        const animeUrl = $el.find('.thumb a').attr('href') || '';
        const poster = $el.find('.thumb img').attr('src') || '';
        const episode = $el.find('.epz').text().trim();
        const day = $el.find('.epztipe').text().trim();
        const date = $el.find('.newnime').text().trim();
        const slug = extractSlug(animeUrl);

        if (title) {
            animeList.push({ title, slug, poster, episode, day, date, url: animeUrl });
        }
    });

    const pagination = {};
    const prevPage = $('.pagenavix a.prev, .pagination a.prev').attr('href');
    const nextPage = $('.pagenavix a.next, .pagination a.next').attr('href');
    pagination.currentPage = page;
    pagination.hasPrev = !!prevPage;
    pagination.hasNext = !!nextPage;

    return { animeList, pagination };
}

// ============== SEARCH ==============
async function scrapeSearch(query) {
    const $ = await fetchPage(`${BASE_URL}/?s=${encodeURIComponent(query)}&post_type=anime`);

    const results = [];
    $('.chivsrc li, .page ul li').each((_, el) => {
        const $el = $(el);
        const $a = $el.find('h2 a, .tooltiptext a, a');
        const title = $a.first().text().trim();
        const animeUrl = $a.first().attr('href') || '';
        const poster = $el.find('img').attr('src') || '';
        const slug = extractSlug(animeUrl);

        const genres = [];
        $el.find('.set a, .genres a').each((_, genreEl) => {
            genres.push($(genreEl).text().trim());
        });

        const status = $el.find('.set:contains("Status")').text().replace('Status :', '').trim() || '';

        if (title && animeUrl.includes('/anime/')) {
            results.push({ title, slug, poster, genres, status, url: animeUrl });
        }
    });

    return results;
}

// ============== GENRES ==============
async function scrapeGenres() {
    const $ = await fetchPage(`${BASE_URL}/genre-list/`);

    const genres = [];
    $('.genres li a, .genre-list li a, .tax_box a, ul.genres a').each((_, el) => {
        const name = $(el).text().trim();
        const url = $(el).attr('href') || '';
        const slug = extractSlug(url);
        if (name && !genres.find(g => g.slug === slug)) {
            genres.push({ name, slug, url });
        }
    });

    // Fallback
    if (genres.length === 0) {
        $('a[href*="/genres/"]').each((_, el) => {
            const name = $(el).text().trim();
            const url = $(el).attr('href') || '';
            const slug = extractSlug(url);
            if (name && !genres.find(g => g.slug === slug)) {
                genres.push({ name, slug, url });
            }
        });
    }

    return genres;
}

// ============== ANIME BY GENRE ==============
async function scrapeGenreAnime(slug, page = 1) {
    const url = page > 1
        ? `${BASE_URL}/genres/${slug}/page/${page}/`
        : `${BASE_URL}/genres/${slug}/`;
    const $ = await fetchPage(url);

    const animeList = [];
    $('.col-anime .col-anime-con, .page .col-anime-con, .venser .col-anime .col-anime-con').each((_, el) => {
        const $el = $(el);
        const title = $el.find('.col-anime-title a').text().trim();
        const animeUrl = $el.find('.col-anime-title a').attr('href') || '';
        const poster = $el.find('img').attr('src') || '';
        const slug = extractSlug(animeUrl);
        const studio = $el.find('.col-anime-studio').text().trim();
        const episodes = $el.find('.col-anime-eps').text().trim();
        const score = $el.find('.col-anime-rating').text().trim();
        const date = $el.find('.col-anime-date').text().trim();

        if (title) {
            animeList.push({ title, slug, poster, studio, episodes, score, date, url: animeUrl });
        }
    });

    // Fallback
    if (animeList.length === 0) {
        $('article a, .chivsrc li a, .venz ul li a').each((_, el) => {
            const $el = $(el);
            const title = $el.text().trim();
            const animeUrl = $el.attr('href') || '';
            const animeSlug = extractSlug(animeUrl);

            if (title && animeUrl.includes('/anime/') && !animeList.find(a => a.slug === animeSlug)) {
                animeList.push({ title, slug: animeSlug, url: animeUrl });
            }
        });
    }

    const pagination = {};
    const prevPage = $('.pagenavix a.prev, .pagination a.prev').attr('href');
    const nextPage = $('.pagenavix a.next, .pagination a.next').attr('href');
    pagination.currentPage = page;
    pagination.hasPrev = !!prevPage;
    pagination.hasNext = !!nextPage;

    return { animeList, pagination };
}

module.exports = {
    scrapeHome,
    scrapeAnimeList,
    scrapeAnimeDetail,
    scrapeEpisodeDetail,
    scrapeOngoing,
    scrapeSearch,
    scrapeGenres,
    scrapeGenreAnime,
    BASE_URL,
};

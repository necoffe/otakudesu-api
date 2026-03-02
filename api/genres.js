const { scrapeGenres } = require('../lib/scraper');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

    try {
        const data = await scrapeGenres();
        return res.status(200).json({ status: true, count: data.length, data });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

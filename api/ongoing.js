const { scrapeOngoing } = require('../lib/scraper');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

    const page = parseInt(req.query.page) || 1;

    try {
        const data = await scrapeOngoing(page);
        return res.status(200).json({ status: true, data });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

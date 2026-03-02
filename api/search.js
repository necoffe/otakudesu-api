const { scrapeSearch } = require('../lib/scraper');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ status: false, message: 'Query parameter "q" is required' });
    }

    try {
        const data = await scrapeSearch(q);
        return res.status(200).json({ status: true, count: data.length, data });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

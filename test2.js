const s = require('./lib/scraper');

(async () => {
    try {
        console.log("Fetching episode detail...");
        const ep = await s.scrapeEpisodeDetail('cm-episode-12-sub-indo');
        console.log("Servers count:", ep.streamingServers.length);
        console.log("First server URL:", ep.streamingServers[0]?.url);
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        process.exit(0);
    }
})();

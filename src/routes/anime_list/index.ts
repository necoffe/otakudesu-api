import { Hono } from "hono";
import { fetchText } from "../../libs/axios_instance";
import { load } from 'cheerio';
import { animeList } from "../../libs/scrape_anime_list";

const animeListRoute = new Hono();

animeListRoute.get('/', async (c) => {
    try {
        const data = await fetchText(`${process.env.OTAKUDESU_URL}/anime-list`);
        const $ = load(data);
    
        const animeListScrape = $('#abtext .bariskelom').toString();
        const animeListResult = animeList(animeListScrape);
        
        return c.json(animeListResult, 200);
    } catch (error) {
        return c.json({
            message: "Request timeout :("
        }, 504);
    }
});

export default animeListRoute;

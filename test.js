const axios = require('axios');
const fs = require('fs');

(async () => {
    try {
        const response = await axios.get('https://otakudesu.pl/?s=one+piece&post_type=anime', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
            }
        });
        fs.writeFileSync('test.html', response.data);
        console.log('Saved to test.html');
    } catch (e) {
        console.error(e.message);
    }
})();

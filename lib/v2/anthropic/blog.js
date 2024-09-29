const got = require('@/utils/got');
const cheerio = require('cheerio');
const { parseDate } = require('@/utils/parse-date');

module.exports = async (ctx) => {
    const res = await got.get('https://www.anthropic.com/news');
    const $ = cheerio.load(res.data);
    const result = await Promise.all(
        $(`[class^=PostCard_post-card___]`)
            .toArray()
            .map((x) => {
                const link = new URL($(x).attr('href'), 'https://www.anthropic.com');
                return ctx.cache.tryGet(link.toString(), async () => {
                    const post = await got(link);
                    const $ = cheerio.load(post.data);
                    // const jsvalue = $('script').toArray().map(x => $(x).html()).filter(x => x.includes('publishedOn'));
                    const pubDateString = $('[class^=PostDetail_post-timestamp__]').text().split('●')[0];
                    const ret = {
                        link: link.toString(),
                        title: $('[class^=PostDetail_post-heading__] h1').text(),
                        description: $('article').html(),
                        pubDate: parseDate(pubDateString),
                    };
                    return ret;
                });
            })
    );

    ctx.state.data = {
        title: `Antropic News`,
        link: `https://www.anthropic.com/news`,
        item: result,
    };
};

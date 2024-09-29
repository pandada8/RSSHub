const got = require('@/utils/got');
const cheerio = require('cheerio');
const parser = require('@/utils/rss-parser');

module.exports = async (ctx) => {
    const feed = await parser.parseURL('https://developers.googleblog.com/feed/');
    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);
                item.description = $('.blocks-container').html();
                item.author = $('.author-obj a').map(function() {
                    return $(this).text()
                }).get();
                item.pubDate = $('.date-time').text();
                return item;
            })
        )
    );

    ctx.state.data = {
        title: feed.title,
        link: feed.link,
        description: feed.description,
        item: items,
        language: feed.language,
    };
};

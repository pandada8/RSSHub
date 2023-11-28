const got = require('@/utils/got');
const cheerio = require('cheerio');
const parser = require('@/utils/rss-parser');

module.exports = async (ctx) => {
    const feed = await parser.parseURL('http://feeds.feedburner.com/servethehome');
    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const visited = [item.link];
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);
                item.description = $('.td-post-content').html();
                if ($('.page-nav').length > 0) {
                    /* eslint-disable no-await-in-loop */
                    for (const a of $('.page-nav').find('a')) {
                        const href = $(a).attr('href');
                        if (href && !visited.includes(href)) {
                            visited.push(href);
                            const { data: response } = await got(href);
                            const $ = cheerio.load(response);
                            item.description += $('.td-post-content').html();
                        }
                    }
                    /* eslint-disable no-await-in-loop */
                }
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

const got = require('@/utils/got');
const cheerio = require('cheerio');
const parser = require('@/utils/rss-parser');

module.exports = async (ctx) => {
    const feed = await parser.parseURL('https://www.anandtech.com/rss/');
    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);
                item.description = $('.main_cont > .review').html();
                if ($('.main_cont > .article_links_top').length > 0) {
                    const moreLinks = [];
                    $('.main_cont .ContentPagesListTop option').each((_, e) => {
                        const link = $(e).attr('href');
                        if (link !== item.link) {
                            moreLinks.push(link);
                        }
                    });
                    /* eslint-disable no-await-in-loop */
                    for (const link of moreLinks) {
                        const { data: response } = await got(link);
                        const $ = cheerio.load(response);
                        item.description += $('.main_cont > .review').html();
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

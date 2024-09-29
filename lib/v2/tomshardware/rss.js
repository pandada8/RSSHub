const got = require('@/utils/got');
const cheerio = require('cheerio');
const parser = require('@/utils/rss-parser');

module.exports = async (ctx) => {
    const feed = await parser.parseURL('https://www.tomshardware.com/feeds/all');
    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);
                $('[style*="padding-top"]').removeAttr('style')
                $('.vanilla-image-block picture, .hero-image-padding picture').each((i, e) => {
                    const $e = $(e)
                    const link = $e.find('source[type="image/webp"]')
                    const img = $e.find('img')
                    let src = link.attr('srcset')
                    if (src === undefined) {
                        src = img.attr('data-srcset')
                    }
                    img.attr('srcset', src)
                    img.removeAttr('src')
                    $e.replaceWith(img)
                })
                item.description = '<blockquote>' + $('.byline-social .strapline').html() + '</blockquote>' + $('.hero-image-wrapper').html() + $('#article-body').html();
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

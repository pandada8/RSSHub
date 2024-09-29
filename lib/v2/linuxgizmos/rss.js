const got = require('@/utils/got');
const cheerio = require('cheerio');
const parser = require('@/utils/rss-parser');

module.exports = async (ctx) => {
    const feed = await parser.parseURL('https://linuxgizmos.com/feed/');
    const items = await Promise.all(
        feed.items.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const { data: response } = await got(item.link);
                const $ = cheerio.load(response);
                const body = $('.entrytext');
                body.find('.simplesocialbuttons').remove()
                
                // remove nested <center> tags
                while(body.find('center center').length) {
                    body.find('center center').each(function() {
                        $(this).replaceWith($(this).children());
                    });
                }

                // replace image with big one
                body.find('img').each((i, e) => {
                    const $e = $(e)
                    // https://linuxgizmos.com/files/ESP32-S3-block-diagram-2-450x356.png 450w, https://linuxgizmos.com/files/ESP32-S3-block-diagram-2-125x99.png 125w, https://linuxgizmos.com/files/ESP32-S3-block-diagram-2.png 766w
                    const srcset = $e.attr('srcset').split(', ').pop().split(' ').shift()
                    console.log(srcset)
                    $e.removeAttr('width')
                    $e.removeAttr('height')
                    $e.removeAttr('srcset')
                    $e.removeAttr('sizes')
                    $e.attr('src', srcset)
                })

                item.description = body.html();
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

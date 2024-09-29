const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const { data: response } = await got('https://www.zerotier.com/blog/');
    const index = cheerio.load(response);
    const items = await Promise.all(index('.post-list h3 a.post-thumbnail').get().map((a) => 
        ctx.cache.tryGet(a.attribs.href, async () => {
            const { data: response } = await got(a.attribs.href)
            const $ = cheerio.load(response);
            const body = $('article .container > .content')
            body.find('meta').remove()
            const title = $('.entry-title').text()
            return {
                title,
                link: a.attribs.href,
                description: body.html(),
                pubDate: $('.entry-date').text(),
                author: $('.author-name').text()
            }
        })
    ))

    ctx.state.data = {
        title: 'ZeroTier Blog',
        link: 'https://www.zerotier.com/blog/',
        description: 'Making Global Networking Simple.',
        item: items,
    };
};

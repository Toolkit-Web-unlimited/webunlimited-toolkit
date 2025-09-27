/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://toolkit.webunlimited.ch',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: [
    '/ad-estimator',
    '/contrast-checker', 
    '/copy-booster'
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: ['/', '/safe-zone', '/site-analyzer', '/privacy', '/imprint'],
        disallow: ['/ad-estimator', '/contrast-checker', '/copy-booster'],
      },
    ],
    additionalSitemaps: [
      `${process.env.SITE_URL || 'https://toolkit.webunlimited.ch'}/sitemap.xml`,
    ],
  },
}

import type { LinkSchema } from '@@/schemas/link'
import type { z } from 'zod'
import { parsePath, withQuery } from 'ufo'

export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, '')) // remove leading and trailing slashes
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { homeURL, linkCacheTtl, redirectWithQuery, caseSensitive } = useRuntimeConfig(event)
  const { cloudflare } = event.context
  
  if (event.path === '/' && homeURL)
    return sendRedirect(event, homeURL)
  
  // Anti-hotlink
  const { ALLOWED_REFERERS, REDIRECT_URL } = 	event.context.cloudflare.env
  const referer = getRequestHeader(event, 'referer')
  if (referer) {
    try {
      const allowedReferers = JSON.parse(ALLOWED_REFERERS || '[]')
      if (!allowedReferers.includes("*DISABLE*")) {
        const matched = allowedReferers.some(domain => referer.includes(domain))
        if (!matched) {
          return sendRedirect(event, REDIRECT_URL, 302)
        }
      }
    } catch (err) {
      console.error('Invalid ALLOWED_REFERERS format:', err)
    }
  }

  if (slug && !reserveSlug.includes(slug) && slugRegex.test(slug) && cloudflare) {
    const { KV } = cloudflare.env

    let link: z.infer<typeof LinkSchema> | null = null

    const getLink = async (key: string) =>
      await KV.get(`link:${key}`, { type: 'json', cacheTtl: linkCacheTtl })

    const lowerCaseSlug = slug.toLowerCase()
    link = await getLink(caseSensitive ? slug : lowerCaseSlug)

    // fallback to original slug if caseSensitive is false and the slug is not found
    if (!caseSensitive && !link && lowerCaseSlug !== slug) {
      console.log('original slug fallback:', `slug:${slug} lowerCaseSlug:${lowerCaseSlug}`)
      link = await getLink(slug)
    }

    if (link) {
      event.context.link = link
      try {
        await useAccessLog(event)
      }
      catch (error) {
        console.error('Failed write access log:', error)
      }
      const target = redirectWithQuery ? withQuery(link.url, getQuery(event)) : link.url
      return sendRedirect(event, target, +useRuntimeConfig(event).redirectStatusCode)
    }
  }
})

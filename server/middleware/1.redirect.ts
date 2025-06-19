import type { LinkSchema } from '@@/schemas/link'
import type { z } from 'zod'
import { parsePath, withQuery } from 'ufo'
import { isDevelopment } from 'std-env'

export default eventHandler(async (event) => {
  const { pathname: slug } = parsePath(event.path.replace(/^\/|\/$/g, '')) // remove leading and trailing slashes
  const { slugRegex, reserveSlug } = useAppConfig(event)
  const { homeURL, linkCacheTtl, redirectWithQuery, caseSensitive } = useRuntimeConfig(event)
  const { cloudflare } = event.context

  if (!event.context.cloudflare || !event.context.cloudflare.env || isDevelopment) {
    return
  }
  
  if (event.path === '/' && homeURL)
    return sendRedirect(event, homeURL)
  
  // Anti-hotlink
  if (!cloudflare?.env?.KV) {
    console.error('KV not bound or missing in Worker environment')
    return sendError(event, createError({ statusCode: 500, statusMessage: 'KV not available' }))
  }
  const KV = cloudflare.env.KV
  const referer = getRequestHeader(event, 'referer')
  if (referer) {
    const rawReferers = await KV.get("a_allowed_referers")
    let allowedReferers: string[] = []
    try {
      allowedReferers = JSON.parse(rawReferers || '[]')
    } catch (e) {
      console.error('Invalid allowed_referers JSON in KV:', e)
    }
    if (!allowedReferers.includes("*DISABLE*")) {
      const matched = allowedReferers.some(domain => referer.includes(domain))
      if (!matched) {
        const redirectUrl = await KV.get("a_redirect_url")
        return sendRedirect(event, redirectUrl, 302)
      }
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

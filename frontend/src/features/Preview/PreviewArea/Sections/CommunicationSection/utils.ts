/**
 * Get a label for a given URL based on its hostname.
 * @param url - The URL to process.
 * @returns A label for the URL.
 */
export const getLinkLabel = (url: string) => {
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    const h = u.hostname.toLowerCase()
    if (h.includes('linkedin')) return 'LinkedIn'
    if (h.includes('github')) return 'GitHub'
    if (h.includes('x.com') || h.includes('twitter')) return 'Twitter'
    if (h.includes('facebook')) return 'Facebook'
    if (h.includes('instagram')) return 'Instagram'
    if (h.includes('t.me') || h.includes('telegram')) return 'Telegram'
    return u.hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

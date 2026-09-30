import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { PROFILE, SKILLS, PROJECTS } from './src/data.js'

// ------------------------------------------------------------------
// Static snapshot for crawlers & AI agents
// ------------------------------------------------------------------
// The site is a React single-page app: the server sends an empty
// <div id="root"></div> and the projects only appear after JavaScript
// runs. Search engines and AI agents that don't run JavaScript therefore
// see NO projects (and fall back on stale caches or old information).
//
// This plugin runs at build time (on every Vercel deploy), reads
// src/data.js - the single source of truth - and:
//   1. puts a plain-HTML copy of the content inside <div id="root">
//      (React replaces it as soon as the app loads),
//   2. adds JSON-LD structured data to <head>,
//   3. generates /llms.txt, /robots.txt and /sitemap.xml.
// No manual step: editing data.js as usual updates everything.
// ------------------------------------------------------------------

const SITE = 'https://idanavioz.com'

// Escape text so it is safe inside HTML
const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const abs = (u = '') => (u.startsWith('http') ? u : SITE + u)
const videos = (p) => (Array.isArray(p.videoUrl) ? p.videoUrl : p.videoUrl ? [p.videoUrl] : [])
const fullName = `${PROFILE.firstName} ${PROFILE.lastName}`

// 1) Plain-HTML snapshot (dark background so the brief pre-load view matches the site)
function snapshotHtml() {
  const projects = PROJECTS.map((p) => {
    const specs = Object.entries(p.specs || {})
      .map(([k, v]) => `<li><b>${esc(k)}:</b> ${esc(v)}</li>`).join('')
    const challenges = (p.challenges || [])
      .map((c) => `<li><b>Problem:</b> ${esc(c.problem)} <b>Solution:</b> ${esc(c.solution)}</li>`).join('')
    const code = p.github ? `<p>Source code: <a href="${esc(p.github)}">${esc(p.github)}</a></p>` : ''
    return `<article id="${esc(p.id)}">
<h3>${esc(p.title)}</h3>
<p><i>${esc(p.category)}</i></p>
<p>${esc(p.summary)}</p>
<p>${esc(p.description)}</p>
<p><b>Tech stack:</b> ${esc((p.techStack || []).join(', '))}</p>
${specs ? `<ul>${specs}</ul>` : ''}
${challenges ? `<h4>Challenges</h4><ul>${challenges}</ul>` : ''}
${code}
</article>`
  }).join('\n')

  const skills = SKILLS.map((s) => `<li>${esc(s.name)} (${esc(s.category)})</li>`).join('')

  return `<div id="static-snapshot" style="background:#111110;color:#ccc;font-family:system-ui,sans-serif;max-width:900px;margin:0 auto;padding:40px 20px;line-height:1.6">
<header>
<h1>${esc(fullName)}</h1>
<p>${esc(PROFILE.tagline)}</p>
<p>${esc(PROFILE.bio)}</p>
</header>
<section id="about"><h2>About</h2><p>${esc(PROFILE.aboutText)}</p></section>
<section id="projects"><h2>Projects (${PROJECTS.length})</h2>
${projects}
</section>
<section id="skills"><h2>Skills</h2><ul>${skills}</ul></section>
<section id="contact"><h2>Contact</h2>
<p>Email: <a href="mailto:${esc(PROFILE.email)}">${esc(PROFILE.email)}</a></p>
${PROFILE.linkedin ? `<p>LinkedIn: <a href="${esc(PROFILE.linkedin)}">${esc(PROFILE.linkedin)}</a></p>` : ''}
${PROFILE.github ? `<p>GitHub: <a href="${esc(PROFILE.github)}">${esc(PROFILE.github)}</a></p>` : ''}
</section>
</div>`
}

// 2) JSON-LD structured data (schema.org)
function jsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: fullName,
      description: PROFILE.bio,
      email: `mailto:${PROFILE.email}`,
      url: SITE,
      sameAs: [PROFILE.linkedin, PROFILE.github].filter(Boolean),
      knowsAbout: SKILLS.map((s) => s.name),
    },
    hasPart: {
      '@type': 'ItemList',
      numberOfItems: PROJECTS.length,
      itemListElement: PROJECTS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'CreativeWork',
          name: p.title,
          genre: p.category,
          abstract: p.summary,
          keywords: (p.techStack || []).join(', '),
          ...(p.thumbnail ? { image: abs(p.thumbnail) } : {}),
          ...(p.github ? { codeRepository: p.github } : {}),
        },
      })),
    },
  }
  // "<" escaped so the JSON can never close the <script> tag early
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`
}

// 3a) llms.txt - a plain-text summary written for AI agents
function llmsTxt() {
  const lines = [
    `# ${fullName} — Portfolio`,
    '',
    `> ${PROFILE.tagline}. ${PROFILE.bio}`,
    '',
    PROFILE.aboutText,
    '',
    `## Projects (${PROJECTS.length}, newest first)`,
    '',
  ]
  PROJECTS.forEach((p, i) => {
    lines.push(`### ${i + 1}. ${p.title}`)
    lines.push(`- Category: ${p.category}`)
    lines.push(`- Summary: ${p.summary}`)
    lines.push(`- Tech stack: ${(p.techStack || []).join(', ')}`)
    Object.entries(p.specs || {}).forEach(([k, v]) => lines.push(`- ${k}: ${v}`))
    if (p.github) lines.push(`- Source code: ${p.github}`)
    videos(p).forEach((v) => lines.push(`- Video: ${abs(v)}`))
    lines.push('')
  })
  lines.push('## Skills', '')
  SKILLS.forEach((s) => lines.push(`- ${s.name} (${s.category})`))
  lines.push('', '## Contact', '', `- Email: ${PROFILE.email}`)
  if (PROFILE.linkedin) lines.push(`- LinkedIn: ${PROFILE.linkedin}`)
  return lines.join('\n') + '\n'
}

function seoSnapshotPlugin() {
  return {
    name: 'seo-snapshot',
    apply: 'build', // only on `vite build` (Vercel); dev server unchanged
    transformIndexHtml(html) {
      return html
        .replace('<div id="root"></div>', `<div id="root">${snapshotHtml()}</div>`)
        .replace('</head>', `    ${jsonLd()}\n  </head>`)
    },
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10)
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt() })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod></url>\n  <url><loc>${SITE}/llms.txt</loc><lastmod>${today}</lastmod></url>\n</urlset>\n`,
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), seoSnapshotPlugin()],
})

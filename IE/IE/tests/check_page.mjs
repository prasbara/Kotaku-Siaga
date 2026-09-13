async function run() {
  console.log('Testing http://localhost:3000...')
  const res = await fetch('http://localhost:3000')
  console.log('Page response status:', res.status)
  const html = await res.text()
  
  const cssMatches = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map((m) => m[1])
  console.log('CSS links in HTML:', cssMatches)

  for (const href of cssMatches) {
    const cssUrl = href.startsWith('http') ? href : 'http://localhost:3000' + href
    const cRes = await fetch(cssUrl)
    const text = await cRes.text()
    console.log(`  CSS ${cssUrl} -> HTTP ${cRes.status}, size: ${text.length} bytes`)
  }

  // Check dark mode and classes
  console.log('HTML contains class="dark":', html.includes('class="dark"'))
  console.log('HTML contains bg-surface:', html.includes('bg-surface'))
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

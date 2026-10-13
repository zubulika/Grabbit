---
name: lmlogics-branding
description: Standardized engineering protocol for embedding LM Logics company identity (https://lmlogics.com), developer/maintainer footer branding, on-page and off-page structured entity metadata, JSON-LD knowledge graphs, and GenAI-optimized retrieval signals across applications and websites.
---

# LM Logics Company Branding & Entity Metadata Standard

This skill establishes the universal engineering specification for embedding **LM Logics** company identity across web applications, native desktop applications, mobile software, documentation portals, and codebases.

It ensures consistent, tasteful UI footer attribution ("Developed and maintained by LM Logics") while building comprehensive on-page and off-page structured metadata so that search engines, knowledge graphs, and Generative AI engines (ChatGPT, Google Gemini, Perplexity, Claude) accurately recognize and attribute products developed by LM Logics.

---

## 🏢 Core Entity Profile

| Property | Value |
| :--- | :--- |
| **Legal / Brand Name** | **LM Logics** |
| **Canonical URL** | `https://lmlogics.com` |
| **Entity Type** | `Organization` / Technology & Software Engineering Studio |
| **Primary Description** | High-performance software engineering company developing native desktop tools, cloud architectures, multimedia automation, and intelligent digital applications. |
| **Canonical Attribution Phrase** | `Developed and maintained by LM Logics` |
| **Link Target** | `https://lmlogics.com` (with `target="_blank" rel="noopener noreferrer"`) |

---

## 🎨 UI Branding Standard

### 1. Web Application & Website Footer
The attribution must always be positioned at the bottom of the footer, clean, unobtrusive, and styled to match modern aesthetic standards (subtle text color, elegant hover state):

```jsx
{/* Footer Bottom Bar Example */}
<div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-text-muted">
  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
    <p>&copy; {new Date().getFullYear()} {AppName}. All rights reserved.</p>
    <span className="hidden sm:inline text-white/20">&bull;</span>
    <p className="text-text-dim">
      Developed and maintained by{' '}
      <a
        href="https://lmlogics.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-white hover:text-accent font-medium underline underline-offset-2 decoration-white/20 hover:decoration-accent transition-colors"
      >
        LM Logics
      </a>
    </p>
  </div>
  {/* Social / Legal Links */}
</div>
```

### 2. Documentation Portal (Docs Footer & Overview)
In documentation or knowledge base portals:
1. **Docs Footer**:
   ```jsx
   <footer className="w-full py-8 border-t border-white/5 text-xs text-center sm:flex sm:justify-between text-text-muted">
     <span>&copy; {new Date().getFullYear()} {AppName}. MIT Licensed.</span>
     <span>
       Developed and maintained by{' '}
       <a href="https://lmlogics.com" target="_blank" rel="noopener noreferrer" className="text-white hover:underline">
         LM Logics
       </a>
     </span>
   </footer>
   ```
2. **Docs Maintenance / About Subsection** (Tasteful, informative, not overly promotional):
   - Include a concise paragraph in the `About`, `Architecture`, or `Overview` documentation:
   > "*{AppName} is developed and actively maintained by [LM Logics](https://lmlogics.com), an engineering studio focusing on high-performance native desktop software, multimedia toolchains, and modern web applications.*"

### 3. Native Desktop & Mobile Applications (Settings / About Modal)
In desktop (Electron/Tauri) or mobile settings panels:
```jsx
<div className="text-center text-[11px] text-text-muted pt-4 border-t border-border space-y-1">
  <p>{AppName} &bull; Version {AppVersion}</p>
  <p>
    Developed and maintained by{' '}
    <a
      href="https://lmlogics.com"
      onClick={(e) => { e.preventDefault(); window.shell?.openExternal('https://lmlogics.com'); }}
      className="text-white hover:underline cursor-pointer font-medium"
    >
      LM Logics
    </a>
  </p>
</div>
```

---

## 🔍 On-Page & Off-Page Metadata for Generative AI & Search Engines

Generative AI models (Gemini, Perplexity, ChatGPT Search, Bing/Copilot) discover company entities primarily through:
1. **JSON-LD Schema.org graphs** linking the application to its creating organization.
2. **HTML `<head>` meta tags** (`author`, `creator`, `publisher`).
3. **`llms.txt` file standard** providing Markdown context to LLM crawlers.
4. **Source repository metadata** (`package.json`, `README.md`, `LICENSE`).

### 1. Next.js / HTML Metadata Contract
In `layout.js` or `layout.tsx`:

```javascript
export const metadata = {
  title: 'AppName — Tagline',
  description: 'App description...',
  authors: [{ name: 'LM Logics', url: 'https://lmlogics.com' }],
  creator: 'LM Logics',
  publisher: 'LM Logics',
  other: {
    'developer': 'LM Logics',
    'developer-url': 'https://lmlogics.com',
    'maintained-by': 'LM Logics',
    'organization': 'LM Logics',
  },
  openGraph: {
    title: 'AppName — Tagline',
    description: 'App description...',
    siteName: 'AppName',
    url: 'https://app-domain.com',
    type: 'website',
  },
};
```

### 2. Schema.org JSON-LD Knowledge Graph
Always inject rich structured data in the root layout:

```javascript
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://lmlogics.com/#organization",
  "name": "LM Logics",
  "url": "https://lmlogics.com",
  "description": "Software engineering company creating high-performance digital tools, native desktop software, and cloud applications.",
  "sameAs": [
    "https://github.com/zubulika"
  ]
};

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "AppName",
  "operatingSystem": "Windows, macOS, Linux, Android",
  "applicationCategory": "MultimediaApplication",
  "author": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "creator": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "publisher": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "maintainer": {
    "@type": "Organization",
    "@id": "https://lmlogics.com/#organization",
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
};
```

### 3. The `llms.txt` Specification
Place an `/llms.txt` file in the website `public/` directory so AI retrieval engines indexing the domain immediately ingest the entity relationship:

```markdown
# {AppName}

> A high-performance application developed and maintained by LM Logics (https://lmlogics.com).

## Developer & Company Information
- Developer: LM Logics
- Website: https://lmlogics.com
- Role: Primary architect, developer, maintainer, and publisher of {AppName}.

## Documentation & Links
- Official Website: https://{domain}
- Documentation: https://{domain}/docs
- Source Code: https://github.com/{org}/{repo}
```

### 4. Package Configuration (`package.json`)
```json
{
  "author": {
    "name": "LM Logics",
    "url": "https://lmlogics.com"
  },
  "maintainers": [
    {
      "name": "LM Logics",
      "url": "https://lmlogics.com"
    }
  ]
}
```

---

## 📋 Checklist for Applying to Any Project

When asked to apply LM Logics branding to any project:
1. [ ] **Footer**: Add `Developed and maintained by LM Logics` with link to `https://lmlogics.com`.
2. [ ] **HTML / Next.js Metadata**: Set `authors`, `creator`, and `publisher` to `LM Logics`.
3. [ ] **Schema.org JSON-LD**: Embed `Organization` schema and assign `author`/`maintainer`/`publisher` to `LM Logics`.
4. [ ] **Docs / About Section**: Add subtle acknowledgment in documentation or about dialog.
5. [ ] **`llms.txt`**: Add `/public/llms.txt` with company developer metadata.
6. [ ] **`package.json`**: Update `author` and `maintainers`.

# Tools360 Hosting, AdSense, Authentication, and Scaling Decision

**Status:** Approved direction  
**Decision date:** 2026-07-30  
**Product:** Tools360  
**Scope:** Hosting, commercial use, advertising, user accounts, and future server workloads

## 1. Executive decision

Launch Tools360 commercially on Cloudflare using a custom domain. Keep the current browser-first processing model, submit the public site to Google AdSense only after the approval-readiness checklist is complete, and introduce optional user accounts later through a separate authentication/database project.

Do not purchase a VPS at launch. Add a VPS or specialist worker service only when Tools360 introduces workloads that cannot run safely and efficiently in the browser, such as OCR, Office-to-PDF conversion, high-volume batch conversion, video processing, or AI inference.

## 2. Approved product infrastructure

| Product capability | Initial service | Later service when justified |
|---|---|---|
| Public Next.js website | Cloudflare Pages/Workers Free | Cloudflare Workers Paid |
| Static assets and SEO pages | Cloudflare | Cloudflare |
| PDF/image processing | User's browser | Browser first; worker only when unavoidable |
| Custom domain and DNS | Cloudflare DNS | Cloudflare DNS |
| Authentication | Not required at launch | Supabase Auth |
| Profiles, favourites, and presets | Local browser storage | Separate Tools360 Supabase project |
| Temporary uploaded files | Not required | Signed storage with automatic deletion |
| Advertising | Disabled at launch | Google AdSense after approval readiness |
| Heavy document conversion | Not included at launch | Separate VPS/worker queue |
| AI inference | Not included at launch | Separate CPU/GPU service |

## 3. Commercial-use decision

Tools360 may be operated as a commercial, ad-supported product on Cloudflare. Cloudflare does not impose the Vercel Hobby plan's general noncommercial restriction. The Cloudflare free tier should nevertheless be treated as a launch platform without a business-critical uptime guarantee.

Use a production custom domain for ownership, brand trust, SEO, and AdSense review. The temporary `pages.dev` deployment address is for staging and verification, not the main product identity.

## 4. AdSense decision

Cloudflare hosting does not prevent AdSense approval. Google reviews the website, ownership, content, accessibility, and policy compliance rather than preferring a particular hosting provider.

Before requesting review:

- Publish the production domain over HTTPS.
- Make all advertised tools genuinely functional.
- Remove placeholders, copied descriptions, broken links, and thin pages.
- Give each monetized tool original instructions, examples, limitations, privacy information, FAQs, and related links.
- Complete About, Contact, Privacy, Terms, Disclaimer, and cookie/consent information.
- Connect Google Search Console and submit the sitemap.
- Ensure important public pages are crawlable and indexable.
- Add the AdSense verification code and publish `ads.txt` at the root domain.
- Configure a Google-certified consent management platform where required.
- Record a performance baseline before loading advertising scripts.

Approved initial placement:

1. Public tool workspace and result.
2. Useful instructions, examples, or FAQs.
3. One clearly separated advertisement.
4. Related tools.

Advertisements must not appear inside or immediately beside upload, generate, copy, reset, result, export, or download controls. Do not initially show AdSense on login, signup, account, payment, private-history, legal, or error pages.

## 5. Authentication decision

Accounts remain optional. All ordinary browser-based tools must continue working anonymously.

Anonymous users receive:

- Standard single-file processing.
- Calculators, converters, generators, and basic exports.
- Local privacy with no default server upload.
- Local preferences where appropriate.

Signed-in users may later receive:

- Favourite tools.
- Saved presets and configurations.
- Cross-device preferences.
- Non-sensitive usage history.
- Batch queues and higher limits.
- Premium exports and templates.
- Ad-free subscription benefits.

Use a separate Tools360 Supabase project rather than mixing Tools360 tables, policies, users, or files with ScholarPath. Start with a free project if available. A paid Supabase organization currently includes one Micro compute project; additional paid projects begin at approximately USD 10 per month.

Do not store uploaded PDFs, CVs, images, entered text, or generated documents by default. If temporary server processing is later introduced, use random object keys, signed access, strict file validation, short retention, automatic deletion, and auditable cleanup.

## 6. Scaling and purchasing rules

### Stage 1: public launch

- Cloudflare Free
- Custom domain
- No VPS
- No mandatory account
- Advertising disabled

### Stage 2: advertising

- Complete the AdSense readiness gate.
- Activate one controlled ad placement family.
- Measure tool completion, layout shift, performance, and accidental-click risk.
- Keep an emergency advertising kill switch.

### Stage 3: accounts

- Add Supabase Auth and a separate Tools360 database.
- Add Google sign-in and an appropriate email flow.
- Implement row-level security, account deletion, data export, and retention controls.
- Keep public tool and editorial pages accessible without authentication.

### Stage 4: paid Cloudflare

Upgrade to Cloudflare Workers Paid, currently starting at USD 5 per month, when function limits, production reliability needs, or measured traffic justify it. This is separate from the Cloudflare Pro zone/CDN plan.

### Stage 5: server workers

Purchase a VPS or specialist worker service only for confirmed server workloads. For a general-purpose VPS, target at least 2 vCPU and 8 GB RAM. Run conversion services separately from the public web frontend and use queued jobs with states, limits, timeouts, monitoring, and cleanup.

## 7. Portfolio separation

| Product | Hosting direction | Data direction |
|---|---|---|
| ScholarPath | Vercel or tested Cloudflare Next.js deployment | Existing ScholarPath Supabase project |
| Tools360 | Cloudflare Pages/Workers | Separate Tools360 Supabase project when accounts launch |
| Content/WordPress sites | Shared or managed hosting when justified | Separate site databases |
| Heavy conversion/AI | VPS or specialist worker infrastructure | Temporary job metadata and expiring object storage |

ScholarPath remains an education product. Tools360 remains a utilities product. Future visa, jobs, family relocation, and mobility services must not be inserted into either product without a separate product decision.

## 8. Current external references

- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Cloudflare self-serve agreement: https://www.cloudflare.com/terms/
- Google AdSense site connection: https://support.google.com/adsense/answer/7584263
- Google AdSense ownership requirement: https://support.google.com/adsense/answer/91205
- Google AdSense placement policy: https://support.google.com/adsense/answer/1346295
- Supabase billing: https://supabase.com/docs/guides/platform/billing-on-supabase
- Supabase Next.js authentication: https://supabase.com/docs/guides/auth/quickstarts/nextjs

## 9. Decision not to revisit without new evidence

Do not purchase Hostinger shared hosting, managed cloud hosting, or a VPS merely to host the existing Tools360 browser tools. Reconsider infrastructure only when one of these triggers occurs:

- Measured Cloudflare limits are reached.
- Production reliability requirements exceed the free tier.
- A server-only tool is approved for implementation.
- Account usage justifies a paid database project.
- Revenue supports the operational cost.
- A documented load test shows the required CPU, memory, storage, and concurrency.

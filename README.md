# EHE source and design archive

Original website, site admin, client/planner prototypes, scripts and preview images, copied without changing the originals. `SOURCE-MANIFEST.json` records SHA-256 checksums and original locations. This repository is a reference baseline, not a production deployment.

## Run the existing implementation

- Website and site admin: Node 24+, `cd original-website`, `node server.cjs`, open http://127.0.0.1:4173. This creates local runtime data and a new local admin password under ignored `work/`.
- Planner/client: `cd pulmaplaan`, `node verify-flows.mjs`; serve `dist/` using any static server. These prototypes share localStorage only on the same origin. They are not authenticated multi-user applications.
- Homepage design: `cd ehe-homepage-mockup`, `node server.cjs`, open http://127.0.0.1:4175.

Historical editing scripts contain their original absolute paths. Do not run them against your old project unintentionally. Deployment archives are left in the original workspace; their extracted source is preserved here. Runtime databases, credentials, uploaded customer media and hosting IDs are intentionally excluded. No customer-data migration has been performed. Review rights to photographs before making the repository public.

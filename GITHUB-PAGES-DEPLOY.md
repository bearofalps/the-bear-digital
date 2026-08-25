# The Bear — GitHub Pages deployment package

Target: https://bearbook.alpskimedved.xyz

This folder is ready to be the repository root for a GitHub Pages site.

Required one-time account settings after upload:
1. Repository Settings → Pages → Source: Deploy from a branch → `main` / `(root)`.
2. Repository Settings → Pages → Custom domain: `bearbook.alpskimedved.xyz`.
3. At the DNS provider for `alpskimedved.xyz`, add CNAME `bearbook` → `bearofalps.github.io`.
4. After DNS resolves, enable Enforce HTTPS in GitHub Pages.

Do not alter the apex/MX records for alpskimedved.xyz.

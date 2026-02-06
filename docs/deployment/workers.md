# Deployment on Cloudflare Workers

1. [Fork](https://github.com/miantiao-me/Sink/fork) the repository to your GitHub account.
2. Create a [KV namespace](https://developers.cloudflare.com/kv/) (under **Storage & Databases** -> **KV**), and copy the namespace ID.
3. Update the `kv_namespaces` ID in `wrangler.jsonc` with your own namespace ID.
4. (_Optional_) For OpenGraph image upload, create an [R2 bucket](https://developers.cloudflare.com/r2/) named `sink` (or run `wrangler r2 bucket create sink`). If you don't need this feature, comment out the `r2_buckets` section in `wrangler.jsonc`.
5. Create a project in [Cloudflare Workers](https://developers.cloudflare.com/workers/).
6. Select the `Sink` repository and use the following build and deploy commands:
   - **Build command**: `pnpm run build` or `npm run build`
   - **Deploy command**: `npx wrangler deploy`

7. Save and deploy the project.
8. After deployment, go to **Settings** -> **Variables and Secrets** -> **Add**, and configure the following environment variables:
   - `NUXT_SITE_TOKEN`: Must be at least **8** characters long. This token grants access to your dashboard.
   - `NUXT_CF_ACCOUNT_ID`: Find your [account ID](https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids/).
   - `NUXT_CF_API_TOKEN`: Create a [Cloudflare API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) with at least `Account.Account Analytics` permission. [See reference.](https://developers.cloudflare.com/analytics/analytics-engine/sql-api/#authentication)

8. Go to the KV namespace you created and add key values ​​to configure anti-hotlink rules:
   - `a_redirect_url`: Add redirect links to hotlink protection rules. (eg.`https://example.com`)
   - `a_allowed_referers`: Add a source whitelist to the anti-hotlink rule, using the inclusion judgment rule (eg.`["123.com", "456.com"]`, Referers that do not contain 123.com or 456.com will be redirected to `a_redirect_url`); And you can set `["*DISABLE*"]` to disable the hotlink protection rule.

   **IMPORTANT**: If you want to use anti-hotlink function, you must create an `a_allowed_referers` property that includes the domain name of the website you are deploying; otherwise, you may experience infinite redirects.

9. Enable Analytics Engine. In **Workers & Pages**, go to **Account details** in the right panel, locate **Analytics Engine**, and click **Set up** to enable the free tier. Name them `sink` and `ANALYTICS`, or else overwrite it with `NUXT_DATASET` and update your `wrangler.jsonc` accordingly
10. Redeploy the project.
11. To update your code, refer to the official GitHub documentation: [Syncing a fork branch from the web UI](https://docs.github.com/pull-requests/collaborating-with-pull-requests/working-with-forks/syncing-a-fork#syncing-a-fork-branch-from-the-web-ui 'GitHub: Syncing a fork').

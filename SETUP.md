# GB Mortgages website: setup guide

This guide takes about 30 to 45 minutes. At the end, the site is live on Philly's domain, she can edit it herself at /admin, and enquiries go to her inbox and to Trail.

## What's in this folder

| Part | What it does |
|---|---|
| `src/_data/*.json` | All the words on the site, one file per section. The editor changes these files. |
| `src/index.njk`, `src/disclosure.njk` | The page layouts. Philly can't change these, so the design stays consistent. |
| `src/admin/` | The editor (Decap CMS) at yoursite/admin. |
| `src/images/` | Logos and photos. New uploads go in `src/images/uploads/`. |
| `netlify/functions/submission-created.mjs` | Sends each enquiry to Trail. |
| `netlify.toml` | Build settings for Netlify. Nothing to change. |

## Step 1: Put the project on GitHub

1. Create a free GitHub account, or use yours.
2. Create a new **private** repository called `gb-mortgages-website`.
3. Upload everything in this folder to it. Use GitHub Desktop, or drag the files onto the repository page. Leave out `node_modules` and `_site` if they're there.

Put the repository in an account Philly owns, or transfer it to her at handover. Then she owns her website.

## Step 2: Put the site on Netlify

1. Log in to Netlify (free plan) and choose **Add new site**, then **Import an existing project**, then GitHub.
2. Pick the `gb-mortgages-website` repository. Netlify reads the build settings from `netlify.toml`, so click **Deploy**.
3. Wait about 2 minutes. Check the site on the temporary netlify.app address it gives you.
4. Under **Forms**, check a form called `enquiry` is listed. If not, turn on form detection and redeploy.

## Step 3: Send enquiries to Philly's inbox

1. In Netlify, go to **Site configuration**, then **Notifications**, then **Emails and webhooks**.
2. Add a **Form submission notification** to Philly's email, for the `enquiry` form.

## Step 4: Set up the editor login (DecapBridge)

Netlify's own login for this editor (Netlify Identity) is being phased out, so we use DecapBridge. It's free, and Philly signs in with an email and password or Google. She doesn't need a GitHub account.

1. Sign up at decapbridge.com.
2. Add a site. It asks for the GitHub repository and a GitHub access token. Create a fine-grained token in GitHub with **read and write access to Contents** for this one repository only.
3. DecapBridge shows you a `backend:` block of settings.
4. Open `src/admin/config.yml` on GitHub, click edit, and replace the whole `backend:` block at the top with the one DecapBridge gave you. Check `site_url` and `display_url` show Philly's domain. Commit the change.
5. In DecapBridge, invite Philly by email.

## Step 5: Connect Trail

The form sends each enquiry to Trail through Trail's API.

1. Ask Trail support (support@gettrail.com) to turn on **API access** for Philly's organisation, if it isn't already.
2. In Trail, go to **Organization settings**, then **Integrations**, then **API Access**, and create a token.
3. In Trail's API reference (developer.gettrail.com), open the **Contact** section. Note the address used to create a contact and the field names it expects.
4. Open `netlify/functions/submission-created.mjs` and check the field names in the `contact` section match Trail's. Change any that don't, and commit.
5. In Netlify, go to **Site configuration**, then **Environment variables**, and add:
   - `TRAIL_API_KEY`: the token from step 2
   - `TRAIL_CONTACT_URL`: the create-contact address from step 3
   - `TRAIL_ADVISER_ID`: optional, if Trail needs to know which adviser the contact belongs to
6. Redeploy (Deploys, then Trigger deploy).
7. Send a test enquiry from the live site. Check it arrives in Philly's inbox and appears in Trail. If it doesn't appear in Trail, open **Logs**, then **Functions**, then `submission-created` in Netlify to see Trail's reply.

If Trail access takes a while, the site still works: every enquiry is saved in Netlify Forms and emailed to Philly.

## Step 6: Connect the GoDaddy domain

1. In Netlify, go to **Domain management** and add Philly's domain.
2. In GoDaddy, open the domain's DNS records:
   - Set the **A** record with name **@** to `75.2.60.5`.
   - Set the **CNAME** record with name **www** to the site's netlify.app address.
   - Delete GoDaddy's "Parked" record and any domain forwarding.
   - Leave the **MX** records alone, or Philly's email stops working.
3. Wait up to an hour. Netlify turns on https by itself.

## Step 7: Register with Google and Bing

1. Add the site to **Google Search Console**. Verify it with the TXT record Google gives you, added in GoDaddy's DNS.
2. Submit `https://www.gbmortgages.co.nz/sitemap.xml`.
3. Do the same in **Bing Webmaster Tools**. You can import the site from Google in one click.

## Before launch

- Fill in every [square bracket] placeholder. They show highlighted on the site until they're replaced. The FSP number is under **Contact details and settings**.
- Check the disclosure statement with Philly's licence holder.
- Replace any photo that looks AI-generated.
- Set the calculator's starting interest rate close to current rates.

## Testing the editor on your own computer (optional)

1. Install Node.js 20, then run `npm install` in this folder.
2. Run `npm run dev` in one window and `npm run cms` in another.
3. Open http://localhost:8080/admin and click **Login**. Changes save straight to the files in this folder.

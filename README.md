# Fairy Fine Cleaning — Website

A 11-page luxury website (plain HTML, CSS and JavaScript, no build step).
Open `index.html` in a browser to preview, or upload the whole folder to any host.

## Pages
index · about · services · gallery · pricing · book-quote · process · areas · reviews · faq · contact

## Folder structure
```
index.html … contact.html   one file per page
css/styles.css              all styling (colors are variables at the top)
js/config.js                ★ phone, email, EmailJS keys, ALL prices
js/pricing.js               price calculator engine
js/main.js                  menu, accordions, tabs, estimator, email sending, contact form
js/hero.js                  hero animation (sparkle canvas, headline reveal, rotating word)
js/gallery.js               before/after sliders, filters, lightbox
js/quote.js                 booking + quote wizard
assets/images/              logo, founder photos, flyers
assets/images/gallery/      before/after photos + placeholders
```

## 1. Make the quote emails work (EmailJS, free plan is enough)
The booking form sends TWO emails: the quote to the client, and a copy to the business owner.
Until you finish this, the site runs in **demo mode** (everything works on screen, nothing is emailed).

1. Create an account at https://www.emailjs.com
2. **Email Services → Add service** → connect the Gmail (fairyfinecleaning@gmail.com). Copy the **Service ID**.
3. **Email Templates → Create template**, with:
   - **To Email:** `{{to_email}}`
   - **From Name:** `{{from_name}}`
   - **Reply To:** `{{reply_to}}`
   - **Subject:** `{{subject}}`
   - **Content (HTML editor):** `{{{message_html}}}`  (three braces so the formatted quote displays)
   Copy the **Template ID**.
4. **Account → General** → copy your **Public Key**.
5. Open `js/config.js` and paste the three values into `emailjs`.
6. Change `ownerEmail` if the owner copy should go to a different address.
7. In EmailJS settings, allow your website domain under security if you enable domain restrictions.

The contact form on `contact.html` uses the same setup.

## 2. Change prices
Open `js/config.js` → `pricing`. Base price, per-bedroom, per-bathroom, size tiers, service multipliers,
recurring discounts and add-ons are all there. The quote page, home estimator and pricing page update automatically.
The prices supplied are **sample rates**. Set your real ones.

## 3. Swap gallery photos
Put your photos in `assets/images/gallery/` and change the file names inside each `<figure class="ba">` in `gallery.html`
(`ba__before` = before photo, `ba__after` = after photo). Same angle and a 4:5 portrait crop look best.
Photos named `placeholder-*.svg` are placeholders. The bathroom, toilet and sink pairs are your real photos.

## 4. Things to check before launch
- **Reviews** on home/reviews pages are SAMPLES (marked “Sample”). Replace with real reviews and delete the tags.
- **Founder name** “Emily Chyane” (about page) came from your business card. Confirm or edit.
- **Claims** such as “we bring our own supplies” and the service-area town list: edit to match reality.
- **Hours** (contact page) and **Facebook link**: edit `FB` in the footer/contact/reviews links (search for `facebook.com`).
- Phone and email appear in the footer of every page; use find-and-replace across files to change them.

## Hosting
Any static host works (Netlify, Vercel, GitHub Pages, cPanel). Upload all files keeping the folder structure.

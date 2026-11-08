/* ==========================================================
   FAIRY FINE CLEANING — SITE SETTINGS
   Edit this file to change contact details, email delivery
   and every price used by the quote calculator.
   ========================================================== */
window.FFC = window.FFC || {};

FFC.config = {
  business: {
    name: "Fairy Fine Cleaning",
    phone: "(843) 653-3830",
    phoneHref: "+18436533830",
    email: "fairyfinecleaning@gmail.com",
    location: "Myrtle Beach, SC",
  },

  /* ---------- EMAIL DELIVERY (EmailJS) ----------
     Create a free account at https://www.emailjs.com, connect your Gmail,
     create ONE email template (see README.md) and paste the three IDs below.
     While the values start with "YOUR_", the site runs in DEMO MODE:
     everything works on screen but no email is sent.                    */
  emailjs: {
    serviceId: "YOUR_SERVICE_ID",
    templateId: "YOUR_TEMPLATE_ID",
    publicKey: "YOUR_PUBLIC_KEY",
    ownerEmail: "fairyfinecleaning@gmail.com", // receives a copy of every booking & contact message
  },

  /* ---------- QUOTE CALCULATOR PRICING (USD) ---------- */
  pricing: {
    minimumTotal: 120,

    services: {
      standard: {
        label: "Standard Clean",
        multiplier: 1.0,
        note: "Regular upkeep of every room",
      },
      deep: {
        label: "Deep Clean",
        multiplier: 1.6,
        note: "Top-to-bottom detail, built-up grime",
      },
      move: {
        label: "Move-In / Move-Out",
        multiplier: 1.8,
        note: "Empty-home reset, inside cabinets & appliances",
      },
    },

    property: {
      house: { label: "House", multiplier: 1.0 },
      apartment: { label: "Apartment", multiplier: 0.9 },
      office: { label: "Office", multiplier: 1.0 },
    },

    base: 70, // starting price for every visit
    perBedroom: 20, // each bedroom (or private office)
    perBathroom: 25, // each bathroom

    sqftTiers: [
      { label: "Under 1,000 sq ft", add: 0 },
      { label: "1,000 – 1,500 sq ft", add: 30 },
      { label: "1,501 – 2,000 sq ft", add: 60 },
      { label: "2,001 – 2,500 sq ft", add: 90 },
      { label: "2,501 – 3,000 sq ft", add: 125 },
      { label: "3,001 – 4,000 sq ft", add: 170 },
      { label: "Over 4,000 sq ft", add: 230 },
    ],

    /* Discounts apply to Standard Cleans only */
    frequency: {
      once: { label: "One time", discount: 0 },
      monthly: { label: "Monthly", discount: 0.05 },
      biweekly: { label: "Every 2 weeks", discount: 0.1 },
      weekly: { label: "Weekly", discount: 0.15 },
    },

    addons: {
      oven: { label: "Inside oven", price: 35 },
      fridge: { label: "Inside refrigerator", price: 30 },
      cabinets: { label: "Inside cabinets", price: 40 },
      windows: {
        label: "Interior windows (up to 10)",
        price: 45,
      },
      baseboards: {
        label: "Detailed baseboards",
        price: 40,
      },
      pets: { label: "Pet hair treatment", price: 30 },
      laundry: {
        label: "Laundry, wash & fold (per load)",
        price: 25,
        unit: "load",
        max: 4,
        onRequest: true,
      },
      organize: {
        label: "Organization (per hour)",
        price: 50,
        unit: "hour",
        max: 6,
        onRequest: true,
      },
    },
  },

  /* Time windows shown on the booking form */
  timeWindows: [
    "Morning (8 am – 11 am)",
    "Midday (11 am – 2 pm)",
    "Afternoon (2 pm – 5 pm)",
    "I’m flexible",
  ],
};

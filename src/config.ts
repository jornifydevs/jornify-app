export const config = {
  appName: "Jornify",
  domainName: "https://jornify.com",
  email: {
    from: "Jornify <noreply@jornify.com>",
    support: "support@jornify.com",
  },
  lemonSqueezy: {
    variantId: process.env.LEMON_SQUEEZY_VARIANT_ID ?? "",
  },
};

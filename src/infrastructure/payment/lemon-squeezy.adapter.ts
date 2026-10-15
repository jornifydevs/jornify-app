import type {
  PaymentService,
  CheckoutSession,
} from "@/core/domain/ports/services/payment.service";

const LEMON_SQUEEZY_API_KEY = process.env.LEMON_SQUEEZY_API_KEY;
const LEMON_SQUEEZY_STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID;

export class LemonSqueezyAdapter implements PaymentService {
  async createCheckoutSession(
    variantId: string,
    companyId: string,
    successUrl: string,
    _cancelUrl: string
  ): Promise<CheckoutSession> {
    if (!LEMON_SQUEEZY_API_KEY)
      throw new Error("LEMON_SQUEEZY_API_KEY is not configured");
    if (!LEMON_SQUEEZY_STORE_ID)
      throw new Error("LEMON_SQUEEZY_STORE_ID is not configured");

    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              custom: {
                ...(companyId ? { company_id: companyId } : {}),
              },
            },
            product_options: {
              redirect_url: successUrl,
            },
          },
          relationships: {
            store: {
              data: { type: "stores", id: LEMON_SQUEEZY_STORE_ID },
            },
            variant: {
              data: { type: "variants", id: variantId },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lemon Squeezy checkout error: ${error}`);
    }

    const data = (await response.json()) as {
      data: { attributes: { url: string } };
    };
    return { url: data.data.attributes.url };
  }
}

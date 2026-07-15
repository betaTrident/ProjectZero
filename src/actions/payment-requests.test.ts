import { beforeEach, describe, expect, it, vi } from "vitest";

const insertPaymentRequest = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: {
          user: {
            id: "user-123",
          },
        },
      })),
    },
    from: (table: string) => {
      if (table === "merchants") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn(async () => ({
            data: {
              id: "12345678-1234-4234-9234-123456789abc",
              stellar_public_key: "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
            },
            error: null,
          })),
        };
      }

      if (table === "payment_requests") {
        return {
          insert: insertPaymentRequest,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  })),
}));

function validPaymentRequestForm() {
  const formData = new FormData();
  formData.set("title", "Invoice");
  formData.set("description", "Test invoice");
  formData.set("amount", "5.00");
  formData.set("assetCode", "XLM");
  formData.set("stellar_destination", "GHACKERDESTINATIONSHOULDNOTBEUSED");
  return formData;
}

describe("createPaymentRequest", () => {
  beforeEach(() => {
    insertPaymentRequest.mockResolvedValue({ error: null });
  });

  it("binds stellar_destination from the server-side merchant profile", async () => {
    const { createPaymentRequest } = await import("./payment-requests");

    await expect(createPaymentRequest(validPaymentRequestForm())).rejects.toThrow(
      "NEXT_REDIRECT:/invoices?created=payment-request",
    );

    expect(insertPaymentRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        stellar_destination: "GC5BBFZZOJT55A66YR7RIH2XVIVQQGSZT5KJSUKRW326BWHOOBSKWVH4",
      }),
    );
    expect(insertPaymentRequest).not.toHaveBeenCalledWith(
      expect.objectContaining({
        stellar_destination: "GHACKERDESTINATIONSHOULDNOTBEUSED",
      }),
    );
  });

  it("generates payment memo entropy without Math.random", async () => {
    const randomSpy = vi.spyOn(Math, "random");
    const { createPaymentRequest } = await import("./payment-requests");

    await expect(createPaymentRequest(validPaymentRequestForm())).rejects.toThrow(
      "NEXT_REDIRECT:/invoices?created=payment-request",
    );

    expect(randomSpy).not.toHaveBeenCalled();
    randomSpy.mockRestore();
  });
});

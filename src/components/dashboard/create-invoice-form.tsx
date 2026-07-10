"use client";

import { createPaymentRequest } from "@/actions/payment-requests";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { defaultExpiresAtLocal } from "@/lib/format/datetime-local";

type ProductOption = {
  id: string;
  name: string;
};

type CreateInvoiceFormProps = {
  products: ProductOption[];
  hasDestination: boolean;
  defaultExpiresAt?: string;
  idPrefix?: string;
};

function fieldId(prefix: string | undefined, name: string) {
  return prefix ? `${prefix}-${name}` : name;
}

export function CreateInvoiceForm({
  products,
  hasDestination,
  defaultExpiresAt = defaultExpiresAtLocal(),
  idPrefix,
}: CreateInvoiceFormProps) {
  return (
    <form action={createPaymentRequest} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={fieldId(idPrefix, "title")}>Title</FieldLabel>
          <Input id={fieldId(idPrefix, "title")} name="title" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldId(idPrefix, "description")}>Description</FieldLabel>
          <Textarea id={fieldId(idPrefix, "description")} name="description" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={fieldId(idPrefix, "amount")}>Amount</FieldLabel>
            <Input
              id={fieldId(idPrefix, "amount")}
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={fieldId(idPrefix, "assetCode")}>Asset</FieldLabel>
            <input type="hidden" name="assetCode" value="XLM" />
            <Input
              id={fieldId(idPrefix, "assetCode")}
              value="XLM"
              readOnly
              disabled
              className="bg-muted"
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor={fieldId(idPrefix, "productId")}>Product</FieldLabel>
          <NativeSelect
            id={fieldId(idPrefix, "productId")}
            name="productId"
            className="w-full"
            defaultValue=""
          >
            <NativeSelectOption value="">No product</NativeSelectOption>
            {products.map((product) => (
              <NativeSelectOption key={product.id} value={product.id}>
                {product.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldId(idPrefix, "expiresAt")}>Expires at</FieldLabel>
          <Input
            id={fieldId(idPrefix, "expiresAt")}
            name="expiresAt"
            type="datetime-local"
            defaultValue={defaultExpiresAt}
          />
        </Field>
      </FieldGroup>
      <SubmitButton
        idleLabel="Create invoice"
        pendingLabel="Creating…"
        disabled={!hasDestination}
      />
      {!hasDestination ? (
        <p className="text-xs text-muted-foreground">
          Add a merchant Stellar public key before creating invoices.
        </p>
      ) : null}
    </form>
  );
}

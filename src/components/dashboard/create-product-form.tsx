"use client";

import { createProduct } from "@/actions/products";
import { SubmitButton } from "@/components/forms/submit-button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateProductFormProps = {
  idPrefix?: string;
};

function fieldId(prefix: string | undefined, name: string) {
  return prefix ? `${prefix}-${name}` : name;
}

export function CreateProductForm({ idPrefix }: CreateProductFormProps) {
  return (
    <form action={createProduct} className="flex flex-col gap-4">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={fieldId(idPrefix, "name")}>Name</FieldLabel>
          <Input id={fieldId(idPrefix, "name")} name="name" required />
        </Field>
        <Field>
          <FieldLabel htmlFor={fieldId(idPrefix, "description")}>Description</FieldLabel>
          <Textarea id={fieldId(idPrefix, "description")} name="description" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor={fieldId(idPrefix, "price")}>Price</FieldLabel>
            <Input
              id={fieldId(idPrefix, "price")}
              name="price"
              type="number"
              step="0.01"
              min="0.01"
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
          <FieldLabel htmlFor={fieldId(idPrefix, "imageUrl")}>Image URL</FieldLabel>
          <Input id={fieldId(idPrefix, "imageUrl")} name="imageUrl" type="url" placeholder="https://" />
        </Field>
      </FieldGroup>
      <SubmitButton idleLabel="Create product" pendingLabel="Creating…" />
    </form>
  );
}

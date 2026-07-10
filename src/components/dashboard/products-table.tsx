import Image from "next/image";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";

type ProductRow = {
  id: string;
  name: string;
  price: number | string;
  asset_code: string;
  is_active: boolean;
  image_url: string | null;
};

type ProductsTableProps = {
  products: ProductRow[];
};

export function ProductsTable({ products }: ProductsTableProps) {
  if (!products.length) {
    return (
      <EmptyState
        icon={Package}
        title="No products yet"
        description="Add products to reuse them when creating invoices."
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {products.map((product) => (
          <article key={product.id} className="flex items-center gap-4 rounded-xl border border-border/70 bg-background/35 p-4">
            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/30">
              {product.image_url ? <Image src={product.image_url} alt="" width={56} height={56} className="size-full object-cover" unoptimized /> : <Package className="size-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0 flex-1"><h3 className="truncate font-medium">{product.name}</h3><p className="mt-1 font-mono text-sm">{Number(product.price).toFixed(2)} {product.asset_code}</p></div>
            <Badge variant={product.is_active ? "default" : "secondary"}>{product.is_active ? "active" : "inactive"}</Badge>
          </article>
        ))}
      </div>
      <div className="hidden overflow-x-auto md:block">
        <Table>
        <TableCaption className="sr-only">Merchant product catalog</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 rounded-md object-cover"
                      unoptimized
                    />
                  ) : null}
                  <span>{product.name}</span>
                </div>
              </TableCell>
              <TableCell>
                {Number(product.price).toFixed(2)} {product.asset_code}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_active ? "default" : "secondary"}>
                  {product.is_active ? "active" : "inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        </Table>
      </div>
    </>
  );
}

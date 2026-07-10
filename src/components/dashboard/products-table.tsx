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
    <div className="overflow-x-auto">
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
  );
}

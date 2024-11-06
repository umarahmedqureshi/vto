import React from "react";
import { DataTable, Card, Thumbnail } from "@shopify/polaris";

export function ProductIndexTable1({ products }) {
  const rows = products.map((product) => [
    <Thumbnail
      source={product.productImage || ""}
      alt={product.productAlt || product.productTitle}
      size="small"
    />,
    <strong>{product.productTitle}</strong>,
    product.productHandle,
    product.productId,
    product.productVariantId,
  ]);

  return (
    <Card>
      <DataTable
        columnContentTypes={["text", "text", "text", "text", "text"]}
        headings={["Image", "Title", "Handle", "Product ID", "Variant ID"]}
        rows={rows}
      />
    </Card>
  );
}

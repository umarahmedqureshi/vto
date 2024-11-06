import { json, useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, Pagination, DataTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor") || null;

  const fetchProducts = async (cursor = null) => {
    const response = await admin.graphql(
      `#graphql
        query fetchProducts($cursor: String) {
          products(first: 10, after: $cursor) {
            edges {
              node {
                id
                title
                handle
                status
                variants(first: 10) {
                  edges {
                    node {
                      id
                      price
                      barcode
                      createdAt
                    }
                  }
                }
              }
              cursor
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `,
      { cursor }
    );
    return await response.json();
  };

  const result = await fetchProducts(cursor);
  const products = result.data.products.edges.map(({ node }) => node);
  const pageInfo = result.data.products.pageInfo;

  return json({
    products,
    pageInfo,
    nextCursor: products.length > 0 ? result.data.products.edges[products.length - 1].cursor : null,
  });
};

export default function ProductIndex() {
  const { products, pageInfo, nextCursor } = useLoaderData();
  const fetcher = useFetcher();
  const [productData, setProductData] = useState(products);

  // Update product data when fetcher completes
  useEffect(() => {
    if (fetcher.data) {
      setProductData(fetcher.data.products);
    }
  }, [fetcher.data]);

  // Prepare table rows
  const rows = productData.map((product) => [
    product.title,
    product.handle,
    product.status,
    product.variants.edges[0]?.node.price || "-",
    product.variants.edges[0]?.node.barcode || "-",
    new Date(product.variants.edges[0]?.node.createdAt).toLocaleDateString(),
  ]);

  return (
    <Page title="Product Index">
      <Card>
        <DataTable
          columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
          headings={["Title", "Handle", "Status", "Price", "Barcode", "Created At"]}
          rows={rows}
        />
      </Card>

      <Pagination
        hasNext={pageInfo.hasNextPage}
        onNext={() => {
          fetcher.load(`/products?cursor=${nextCursor}`);
        }}
        hasPrevious={false}
      />
    </Page>
  );
}

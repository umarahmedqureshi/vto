import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, Pagination, DataTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Function to fetch products from Shopify API
const fetchProducts = async (admin, cursor = null, direction = "next") => {
  const queryDirection = direction === "next" ? "after" : "before";
  const response = await admin.graphql(
    `#graphql
      query fetchProducts($cursor: String) {
        products(first: 10, ${queryDirection}: $cursor) {
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
            hasPreviousPage
            startCursor
            endCursor
          }
        }
      }
    `,
    { variables: { cursor } }
  );

  const responseJson = await response.json();
  return responseJson.data.products;
};

// Loader function to fetch the initial products
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const initialProducts = await fetchProducts(admin);

  return {
    admin,
    initialProducts: initialProducts.edges.map(({ node }) => node),
    pageInfo: initialProducts.pageInfo,
    nextCursor: initialProducts.pageInfo.endCursor,
    prevCursor: initialProducts.pageInfo.startCursor,
  };
};

export default function ProductIndex() {
  const { admin, initialProducts, pageInfo: initialPageInfo, nextCursor: initialNextCursor, prevCursor: initialPrevCursor } = useLoaderData();
  const [productData, setProductData] = useState(initialProducts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [prevCursor, setPrevCursor] = useState(initialPrevCursor);

  // Function to fetch products based on cursor and direction
  const handlePagination = async (cursor, direction) => {
    const products = await fetchProducts(admin, cursor, direction);
    setProductData(products.edges.map(({ node }) => node));
    setPageInfo(products.pageInfo);
    setNextCursor(products.pageInfo.endCursor);
    setPrevCursor(products.pageInfo.startCursor);
  };

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
        onNext={() => handlePagination(nextCursor, "next")}
        hasPrevious={pageInfo.hasPreviousPage}
        onPrevious={() => handlePagination(prevCursor, "previous")}
      />
    </Page>
  );
}

import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, Pagination, DataTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";


// Function to fetch products from Shopify API
const fetchProducts = async (admin, cursor = null, direction = "next") => {
  const queryDirection = direction === "next" ? "after" : "before";
  const firstORLast = direction === "next" ? "first" : "last";
  const response = await admin.graphql(
    `#graphql
      query fetchProducts($cursor: String) {
        products(${firstORLast}: 10, ${queryDirection}: $cursor, sortKey:TITLE) {
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

// Loader for initial products
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const initialProducts = await fetchProducts(admin);

  return {
    initialProducts: initialProducts.edges.map(({ node }) => node),
    pageInfo: initialProducts.pageInfo,
  };
};

// Action for pagination requests
export const action = async ({ request }) => {
  const formData = await request.formData();
  const cursor = formData.get("cursor");
  const direction = formData.get("direction");
  const { admin } = await authenticate.admin(request);

  const products = await fetchProducts(admin, cursor, direction);

  return {
    products: products.edges.map(({ node }) => node),
    pageInfo: products.pageInfo,
  };
};

export default function ProductIndex() {
  const { initialProducts, pageInfo: initialPageInfo } = useLoaderData();
  const fetcher = useFetcher();
  const [productData, setProductData] = useState(initialProducts);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);

  useEffect(() => {
    if (fetcher.data) {
      setProductData(fetcher.data.products);
      setPageInfo(fetcher.data.pageInfo);
    }
  }, [fetcher.data]);

  const handlePagination = (cursor, direction) => {
    fetcher.submit(
      { cursor, direction },
      { method: "post", action: "/app/pr7" } // Replace with the correct route
    );
  };

  const rows = productData.map((product) => [
    product.title,
    product.handle,
    product.status,
    product.variants.edges[0]?.node.price || "-",
    // new Date(product.variants.edges[0]?.node.createdAt).toLocaleDateString(),
    1111,
  ]);

  return (
    <Page title="Product Index">
      <Card>
        <DataTable
          columnContentTypes={["text", "text", "text", "numeric", "text"]}
          headings={["Title", "Handle", "Status", "Price", "Created At"]}
          rows={rows}
        />
      </Card>

      <Pagination
        hasNext={pageInfo.hasNextPage}
        onNext={() => handlePagination(pageInfo.endCursor, "next")}
        hasPrevious={pageInfo.hasPreviousPage}
        onPrevious={() => handlePagination(pageInfo.startCursor, "previous")}
      />
    </Page>
  );
}

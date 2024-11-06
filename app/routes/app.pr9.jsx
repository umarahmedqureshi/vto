import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, IndexTable, Pagination } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Function to fetch products from Shopify API
const fetchProducts = async (admin, cursor = null, direction = "next", sortKey = "createdAt", sortOrder = "ASC") => {
  const queryDirection = direction === "next" ? "after" : "before";
  const firstORLast = direction === "next" ? "first" : "last";
  const response = await admin.graphql(
    `#graphql
      query fetchProducts($cursor: String, $sortKey: ProductSortKeys!, $sortOrder: SortOrder!) {
        products(${firstORLast}: 10, ${queryDirection}: $cursor, sortKey: $sortKey, sortOrder: $sortOrder) {
          edges {
            node {
              id
              title
              handle
              status
              variants(first: 1) {
                edges {
                  node {
                    id
                    price
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
            totalCount
          }
        }
      }
    `,
    { variables: { cursor, sortKey, sortOrder } }
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
  const sortKey = formData.get("sortKey") || "createdAt";
  const sortOrder = formData.get("sortOrder") || "ASC";
  const { admin } = await authenticate.admin(request);

  const products = await fetchProducts(admin, cursor, direction, sortKey, sortOrder);

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
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("ASC");

  useEffect(() => {
    if (fetcher.data) {
      setProductData(fetcher.data.products);
      setPageInfo(fetcher.data.pageInfo);
    }
  }, [fetcher.data]);

  const handleSort = (newSortKey) => {
    const newSortOrder = (newSortKey === sortKey && sortOrder === "ASC") ? "DESC" : "ASC";
    setSortKey(newSortKey);
    setSortOrder(newSortOrder);
    handlePagination(pageInfo.startCursor, "next", newSortKey, newSortOrder);
  };

  const handlePagination = (cursor, direction, sortKey = sortKey, sortOrder = sortOrder) => {
    fetcher.submit(
      { cursor, direction, sortKey, sortOrder },
      { method: "post", action: "/app/pr9" } // Replace with the correct route
    );
  };

  const rows = productData.map((product) => [
    product.title,
    product.handle,
    product.status,
    product.variants.edges[0]?.node.price || "-",
    new Date(product.variants.edges[0]?.node.createdAt).toLocaleDateString(),
  ]);

  return (
    <Page title="Product Index">
      <Card>
        <IndexTable
          itemCount={pageInfo.totalCount}
          items={rows}
          headings={[
            { title: "Title", key: "title", onSort: () => handleSort("title") },
            { title: "Handle", key: "handle" },
            { title: "Status", key: "status" },
            { title: "Price", key: "price" },
            { title: "Created At", key: "createdAt", onSort: () => handleSort("createdAt") },
          ]}
          sortable
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

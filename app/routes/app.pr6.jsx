import { useLoaderData, useFetcher } from "@remix-run/react";
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

// Loader for initial products
export const loader = async ({ request }) => {
  console.log("loader request",request);

  const { admin } = await authenticate.admin(request);
  const initialProducts = await fetchProducts(admin);

  return {
    initialProducts: initialProducts.edges.map(({ node }) => node),
    pageInfo: initialProducts.pageInfo,
  };
};

// Action for pagination requests
export const action = async ({ request }) => {
  console.log("action request",request);

  // const formData = await request.formData();
  // const cursor = formData.get("cursor");
  // const direction = formData.get("direction");
  // const { admin } = await authenticate.admin(request);
  // console.log("action admin",admin);
  

  // const products = await fetchProducts(admin, cursor, direction);

  // return {
  //   products: products.edges.map(({ node }) => node),
  //   pageInfo: products.pageInfo,
  // };
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
    console.log("doijffdjefsd");

    const { admin } = authenticate.admin();

    console.log("doijffdj",admin);
    
    fetcher.submit(
      { cursor, direction },
      { method: "post", action: "/your-route" } // Replace with the correct route
    );
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
        onNext={() => handlePagination(pageInfo.endCursor, "next")}
        hasPrevious={pageInfo.hasPreviousPage}
        onPrevious={() => handlePagination(pageInfo.startCursor, "previous")}
      />
    </Page>
  );
}

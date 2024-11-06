import { json, useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, Pagination, DataTable } from "@shopify/polaris";
// import { fetchProducts } from "./utils/fetchProducts"; // Adjust the path to where fetchProducts is located
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // const url = new URL(request.url);
  // const cursor = url.searchParams.get("cursor") || null;
  
  const { admin } = await authenticate.admin(request);

  // Fetch products with cursor for pagination
  // const products = await fetchProducts(cursor, admin);

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
              endCursor
            }
          }
        }
      `,
      {
        variables: {
          cursor,
        },
      }
    );
  
    const responseJson = await response.json();
    return responseJson.data.products;
  };
  
  let products = [];
  let hasNextPage = true;
  let endCursor = null;
  
  // Loop through paginated results to fetch all products
  while (hasNextPage) {
    const result = await fetchProducts(endCursor);
    console.log("jidfjfk result",result);

    products = [...products, ...result.edges.map(edge => edge.node)];
    hasNextPage = result.pageInfo.hasNextPage;
    endCursor = result.pageInfo.endCursor;
    // if (hasNextPage) {
    //   // cursor = result.edges[result.edges.length - 1].cursor;
    //   cursor = result.edges[result.edges.length - 1].cursor;
    // }
  }
  console.log("jidfjfk products",products);


  return json({
    products: products.edges.map(({ node }) => node),
    pageInfo: products.pageInfo,
    nextCursor: products.edges[products.edges.length - 1]?.cursor || null,
  });
};

export default function ProductIndex() {
  const { products, pageInfo, nextCursor } = useLoaderData();
  const fetcher = useFetcher();
  const [productData, setProductData] = useState(products);

  // Update product data when pagination fetcher completes
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
          columnContentTypes={[
            "text",
            "text",
            "text",
            "numeric",
            "text",
            "text",
          ]}
          headings={["Title", "Handle", "Status", "Price", "Barcode", "Created At"]}
          rows={rows}
        />
      </Card>

      <Pagination
        hasNext={pageInfo.hasNextPage}
        onNext={() => {
          fetcher.load(`/products?cursor=${nextCursor}`);
        }}
        hasPrevious={false} // Customize if you want to add backward pagination
      />
    </Page>
  );
}

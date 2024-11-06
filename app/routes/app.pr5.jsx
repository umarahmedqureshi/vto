import { json, useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, Pagination, DataTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Initial loader to fetch the first page of products only
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  const fetchProducts = async (cursor = null, direction = "next") => {
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

  const initialProducts = await fetchProducts();

  return json({
    products: initialProducts.edges.map(({ node }) => node),
    pageInfo: initialProducts.pageInfo,
    nextCursor: initialProducts.pageInfo.endCursor,
    prevCursor: initialProducts.pageInfo.startCursor,
  });
};

export default function ProductIndex() {
  const initialData = useLoaderData();
  const fetcher = useFetcher();
  const [productData, setProductData] = useState(initialData.products);
  const [pageInfo, setPageInfo] = useState(initialData.pageInfo);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [prevCursor, setPrevCursor] = useState(initialData.prevCursor);

//   const fetchProducts = async (cursor = null, direction = "next") => {
//     const response = await fetcher.load(`/products?cursor=${cursor}&direction=${direction}`);
//     if (response.ok) {
//       const result = await response.json();
//       setProductData(result.products);
//       setPageInfo(result.pageInfo);
//       setNextCursor(result.pageInfo.endCursor);
//       setPrevCursor(result.pageInfo.startCursor);
//     }
//   };

  useEffect(() => {
    if (fetcher.data) {
      setProductData(fetcher.data.products);
      setPageInfo(fetcher.data.pageInfo);
      setNextCursor(fetcher.data.pageInfo.endCursor);
      setPrevCursor(fetcher.data.pageInfo.startCursor);
    }
  }, [fetcher.data]);

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
        onNext={() => fetchProducts(nextCursor, "next")}
        hasPrevious={pageInfo.hasPreviousPage}
        onPrevious={() => fetchProducts(prevCursor, "previous")}
      />
    </Page>
  );
}

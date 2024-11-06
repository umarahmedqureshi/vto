import { useLoaderData, useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { Card, Page, Pagination, IndexTable } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

// Function to fetch products from Shopify API
const fetchProducts = async (admin, cursor = null, direction = "next") => {
  const queryDirection = direction === "next" ? "after" : "before";
  const firstORLast = direction === "next" ? "first" : "last";
  const response = await admin.graphql(
    `#graphql
      query fetchProducts($cursor: String) {
        products(${firstORLast}: 10, ${queryDirection}: $cursor) {
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
      { method: "post", action: "/app/pr8" } // Replace with the correct route
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
        <IndexTable
          itemCount={productData.length}
          headings={[
            { title: 'Title' },
            { title: 'Handle' },
            { title: 'Status' },
            { title: 'Price' },
            { title: 'Created At' },
          ]}
          // selectable={false} // Change to true if you want to allow row selection
        >
          {productData.map((product, index) => (
            <IndexTable.Row id={product.id} key={product.id} position={index}>
              <IndexTable.Cell>{product.title}</IndexTable.Cell>
              <IndexTable.Cell>{product.handle}</IndexTable.Cell>
              <IndexTable.Cell>{product.status}</IndexTable.Cell>
              <IndexTable.Cell>{product.variants.edges[0]?.node.price || '-'}</IndexTable.Cell>
              <IndexTable.Cell>{new Date(product.variants.edges[0]?.node.createdAt).toLocaleDateString()}</IndexTable.Cell>
            </IndexTable.Row>
          ))}
        </IndexTable>
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

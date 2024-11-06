import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

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
  let cursor = null;

  // Loop through paginated results to fetch all products
  while (hasNextPage) {
    const result = await fetchProducts(cursor);
    products = [...products, ...result.edges.map(edge => edge.node)];
    hasNextPage = result.pageInfo.hasNextPage;
    if (hasNextPage) {
      cursor = result.edges[result.edges.length - 1].cursor;
    }
  }

  return json({ products });
}

export default function ProductsPage() {
  const { products } = useLoaderData();

  return (
    <div>
      <h1>Store Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <h2>{product.title}</h2>
            <p>Status: {product.status}</p>
            <p>Handle: {product.handle}</p>
            <ul>
              {product.variants.edges.map(({ node: variant }) => (
                <li key={variant.id}>
                  <p>Price: {variant.price}</p>
                  <p>Barcode: {variant.barcode}</p>
                  <p>Created At: {variant.createdAt}</p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

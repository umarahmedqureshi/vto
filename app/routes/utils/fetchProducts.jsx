// Import Shopify's Admin API function here
// import { admin } from "./shopifyAdmin"; // Adjust the path according to your setup
import { authenticate } from "../../shopify.server";

// The fetchProducts function to fetch products with optional cursor for pagination
export const fetchProducts = async (cursor = null, admin) => {
    // export const loader = async ({ request }) => {

//   const { admin } = await authenticate.admin(request);

  const query = `
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
  `;

  try {
    // Execute the GraphQL request to the Shopify Admin API
    const response = await admin.graphql(query, {
      variables: {
        cursor,
      },
    });

    const responseJson = await response.json();
    console.log("responseJson",responseJson);
    
    if (responseJson.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(responseJson.errors)}`);
    }

    return responseJson.data.products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw new Error("Could not fetch products");
  }
};

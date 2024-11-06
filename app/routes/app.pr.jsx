// import { json, redirect } from "@remix-run/node";
// import { useLoaderData, useActionData } from "@remix-run/react";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  // Text,
  // Modal,
  // BlockStack,
  // DataTable,
  Toast,
  Frame,
} from "@shopify/polaris";
import { ProductDetailsBox, ProductIndexTable1 } from "./components";
// import header from "./utils/headers";
// import { authenticate } from "../shopify.server";

export default function SelectProduct() {
  const [formState, setFormState] = useState({ selectedProducts: [] });
  const [toastActive, setToastActive] = useState(false);

  const handleProductPicker = () => {
    console.log("kucdjns");
    
    window.shopify.resourcePicker({
      type: "product",
      multiple: true,
      action: "select",
      filter: { variants: false },
    }).then((products) => {
      if (products) {
        const allSelectedProducts = products.map((product) => {
          const { images, id, variants, title, handle } = product;
          return {
            productId: id,
            productVariantId: variants[0].id,
            productTitle: title,
            productHandle: handle,
            productAlt: images[0]?.altText,
            productImage: images[0]?.originalSrc,
          };
        });

        setFormState((prevState) => ({
          ...prevState,
          selectedProducts: allSelectedProducts,
        }));

        // Optional: Show a toast notification when products are selected
        // setToastActive(true);
      }
    }).catch((error) => {
      console.error("Error selecting products:", error);
    });
  };

  const handleToastDismiss = () => setToastActive(false);

  return (
    <Frame>
    <Page title="Select Products">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Button onClick={handleProductPicker}>Select Products</Button>
            {/* Example of rendering selected products */}
            {formState.selectedProducts.length > 0 && (
              <ProductIndexTable1 products={formState.selectedProducts} />
            )}
          </Card>
        </Layout.Section>
      </Layout>
      <Toast
        content="Products selected successfully!"
        open={toastActive}
        onDismiss={handleToastDismiss}
      />
    </Page>
    </Frame>
  );
}

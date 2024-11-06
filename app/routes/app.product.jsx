import { useLoaderData, Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { json } from "@remix-run/node";

import {
  Page,
  Layout,
  Card,
  Button,
  Icon,
  Text,
  Frame,
  Modal,
  BlockStack,
  DataTable,
  Combobox,
  Toast,
} from "@shopify/polaris";
import { XCircleIcon, SearchIcon, PlusIcon, StatusActiveIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import axios from "axios";
import { ProductDetailsBox, ProductIndexTable } from "./components";
import "./assets/style.css";
import header from "./utils/headers";
import { authenticate } from "../shopify.server";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient();

// Loader function to fetch group data
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  console.log("shop ----- ",shop);

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1"; // Default to page 1
  const headers = header;

  try {
    const response = await axios.get(`https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup`, { headers });
    // return json(response.data.data.data);
    return json({
      data: response.data.data.data,
      err: null,
      page: parseInt(page),
    });
  } catch (err) {
    // throw new Response('Failed to fetch groups', { status: 500 });
    return json({
      data: null,
      err: "Server Error..!",
      page: parseInt(page),
    }, { status: 500 });
  }
};

export default function Product() {
  const {data, err, page} = useLoaderData();
  const groups = data;
  console.log("useLoaderData groups1",groups);
  
  const [isHidden, setIsHidden] = useState(true);
  const [productId, setProductId] = useState("");
  const [active, setActive] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(err);
  console.log("error dekhte hh",error);
  const [loading, setLoading] = useState(false);

  const handleChildArray = (childArray) => {
    setSelectedItems(childArray);
  };

  const dismissToast = useCallback(() => setDismissed(!dismissed), [dismissed]);
  const showDetails = (id) => {
    setIsHidden(false);
    setProductId(id);
  };

  const closeProductDetailsBox = () => {
    setIsHidden(true);
  };

  const handleAssignProducts = async (groupId, selectedItems) => {
    const headers = header;
    try {
      setLoading(true);
      const response = await axios.post(`https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/assigngroup`, {
        product_id: JSON.stringify(selectedItems),
        group_id: groupId,
      }, { headers });

      if (response.data.success) {
        setError(null);
        dismissToast();
        setSelectedGroupId(null);
        setSelectedItems([]);
      }
    } catch (err) {
      setError('Something went wrong..!');
    } finally {
      setLoading(false);
    }
  };

  const toastMarkup = dismissed ? (
    <Toast content="Group assigned" onDismiss={dismissToast} duration={2000} />
  ) : null;

  const rows = groups && groups.map((group) => [
    group.id,
    group.name,
    group.created_at,
    group.description,
    <div
      className={`hover-button-container ${hoveredRowId === group.id ? 'show' : ''}`}
      onMouseEnter={() => setHoveredRowId(group.id)}
      onMouseLeave={() => setHoveredRowId(null)}
    >
      <Button
        className="hover-button"
        icon={selectedGroupId === group.id ? StatusActiveIcon : PlusIcon}
        tone={selectedGroupId === group.id ? "success" : "primary"}
        variant="plain"
        onClick={() => handleAssignGroup(group.id)}
      />
    </div>,
  ]);

  const handleAssignGroup = (groupId) => {
    setSelectedGroupId(groupId);
    handleAssignProducts(groupId, selectedItems);
  };

  const activator = (
    <Button variant="primary" disabled={!isButtonEnabled} onClick={() => setActive(true)}>
      Assign Group
    </Button>
  );

  return (
    // <Frame>
    <>
    <QueryClientProvider client={queryClient}>
          <Outlet /> {/* Renders nested routes */}
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      <Page fullWidth>
        <Layout>
          <Layout.Section>
            <Card sectioned>
              {error ? (
                <Text variant="headingMd" alignment="center" as="h2" tone="critical">
                    {error}
                </Text>
              ) : (<>
                <div className="inline-view-end">
                  <Text variant="headingMd" as="h6">Products</Text>
                  <Modal
                    activator={activator}
                    open={active}
                    onClose={() => setActive(false)}
                    title="Group Details"
                  >
                    <Modal.Section>
                      <BlockStack>
                        <div style={{ height: '50px' }}>
                          <Combobox
                            activator={
                              <Combobox.TextField
                                prefix={<Icon source={SearchIcon} />}
                                label="Search Groups"
                                labelHidden
                                placeholder="Search Group"
                                autoComplete="off"
                              />
                            }
                          >
                            {/* Add your listboxMarkup here if needed */}
                          </Combobox>
                        </div>
                      </BlockStack>
                      <BlockStack>
                        <DataTable
                          columnContentTypes={["text", "text", "text", "text", "numeric"]}
                          headings={["Id", "Name", "Date", "Description", "Action"]}
                          rows={rows}
                          verticalAlign="middle"
                        />
                      </BlockStack>
                    </Modal.Section>
                  </Modal>
                </div>
                <ProductIndexTable showDetails={showDetails} setIsButtonEnabled={setIsButtonEnabled} sendArrayToParent={handleChildArray} />
                </>
              )}
            </Card>
          </Layout.Section>

          {!isHidden && (
            <Layout.Section variant="oneThird">
              <Card sectioned>
                <div className="inline-view-end">
                  <Text variant="headingMd" as="h6">Product Details</Text>
                  <div onClick={closeProductDetailsBox} style={{ cursor: "pointer" }  }>
                    <Icon source={XCircleIcon} color="base" />
                  </div>
                </div>
                <ProductDetailsBox productId={productId} />
              </Card>
            </Layout.Section>
          )}
        </Layout>
        {toastMarkup}
      </Page>
      </>
    // </Frame>
  );
}

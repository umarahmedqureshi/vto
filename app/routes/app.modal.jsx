import { Card, Page, Layout, BlockStack, Text, Spinner } from "@shopify/polaris";
import { useState, useEffect } from "react";
import { ModalsTable } from "./components";
import axios from "axios";
import header from "./utils/headers";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const headers = header;

  try {
    const response = await axios.get(`https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/models_list?page=${page}`, { headers });
    console.log("modal response", response);
    return json({
      data: response.data,
      err: null,
      page: parseInt(page),
    });
  } catch (err) {
    return json({
      data: null,
      err: "Something went wrong..!",
      page: parseInt(page),
    }, { status: 500 });
  }
};

export default function ModalsPage() {
  const { data, err, page } = useLoaderData();

  const [error, setError] = useState(err);
  const [modals, setModals] = useState(data);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(Number(page));
  console.log("ModalsPage currentPage",currentPage);

  useEffect(() => {
    const fetchData = async (page) => {
      const headers = header;
      try {
        setLoading(true);
        const response = await axios.get(
          `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/models_list?page=${page}`,
          { headers }
        );
        setModals(response.data);
        setError(null);
      } catch (err) {
        setError('Something went wrong..!');
        console.log(err);
        setModals(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData(currentPage);
  }, [currentPage]);
    
  const handleNextPage = () => {
    if (modals && modals.data && modals.data.current_page < modals.data.last_page) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Page title={modals ? modals.message : "Loading..."}>
      <Layout>
        <Layout.Section>
          <Card sectioned>
            {error ? (
              <Text variant="headingMd" alignment="center" as="h2" tone="critical">
                {error}
              </Text>
            ) : loading ? (
              <div style={{ textAlign: "center" }}>
                <Spinner accessibilityLabel="Loading modals data" size="large" />
              </div>
            ) : (
              <BlockStack>
                <ModalsTable
                  modals={modals.data.data}
                  hasPrevious={currentPage > 1}
                  onPrevious={handlePreviousPage}
                  hasNext={modals.data.current_page < modals.data.last_page}
                  onNext={handleNextPage}
                  from={modals.data.from}
                  to={modals.data.to}
                  total={modals.data.total}
                />
              </BlockStack>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "@remix-run/react";
import { AppProvider } from '@shopify/polaris'; // Import the entire CommonJS module
import { Banner, Layout, Page } from "@shopify/polaris";

/**
 * A component to configure App Bridge in a Remix app.
 */
export function AppBridgeProvider({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the memoized history object for navigation
  const history = useMemo(
    () => ({
      replace: (path) => {
        navigate(path, { replace: true });
      },
    }),
    [navigate]
  );

  const routerConfig = useMemo(
    () => ({ history, location }),
    [history, location]
  );

  // Using state to cache the app bridge configuration
  const [appBridgeConfig] = useState(() => {
    const host =
      new URLSearchParams(location.search).get("host") ||
      window.__SHOPIFY_DEV_HOST;

    window.__SHOPIFY_DEV_HOST = host;

    return {
      host,
      apiKey: process.env.SHOPIFY_API_KEY, // Access your environment variable
      forceRedirect: true,
    };
  });

  // Handle missing API key or host errors
  if (!process.env.SHOPIFY_API_KEY || !appBridgeConfig.host) {
    const bannerProps = !process.env.SHOPIFY_API_KEY
      ? {
          title: "Missing Shopify API Key",
          children: (
            <>
              Your app is running without the SHOPIFY_API_KEY environment
              variable. Please ensure that it is set when running or building
              your Remix app.
            </>
          ),
        }
      : {
          title: "Missing host query argument",
          children: (
            <>
              Your app can only load if the URL has a <b>host</b> argument.
              Please ensure that it is set, or access your app using the
              Partners Dashboard <b>Test your app</b> feature.
            </>
          ),
        };

    return (
      <Page narrowWidth>
        <Layout>
          <Layout.Section>
            <div style={{ marginTop: "100px" }}>
              <Banner {...bannerProps} status="critical" />
            </div>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <AppProvider config={appBridgeConfig} router={routerConfig}>
      {children}
    </AppProvider>
  );
}

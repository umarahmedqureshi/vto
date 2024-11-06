import {
  Page,
  Layout,
  Card,
  Button,
  Tabs,
  BlockStack,
  Link as PolarisLink,
  InlineGrid,
  Text,
  Grid
} from "@shopify/polaris";
import { SettingsIcon, ConnectIcon, MinusCircleIcon } from '@shopify/polaris-icons';
import { useState, useCallback } from "react";
import { ConfigurationForm } from "./components/ConfigurationForm"; // Update the path as per your project structure
import { Link } from "@remix-run/react"; // Use Remix Link for routing

export default function HomePage() {
  const [connect, setConnect] = useState(true);
  const [selected, setSelected] = useState(0);
  const [togle, setTogle] = useState(true);
  const [appId, setAppId] = useState('456945-655d-645');

  const handleConnect = useCallback(() => {
    setConnect(!connect);
  }, [connect]);

  const handleDisconnect = () => {
    setConnect(false);
    setTogle(false);
    setAppId('');
  }

  const handleToggle = useCallback(() => {
    setTogle(!togle);
  }, [togle]);

  const handleTabChange = useCallback(
    (selectedTabIndex) => setSelected(selectedTabIndex),
    [],
  );

  const tabs = [
    {
      id: 'authentication',
      content: 'Authentication',
      message: (
        <BlockStack gap="200">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingSm">
              Try On App
            </Text>
            {!connect ? (
              <Button
                onClick={handleConnect}
                accessibilityLabel="Add variant"
                icon={ConnectIcon}
                variant="primary"
              >
                Connect
              </Button>
            ) : (
              <Button
                onClick={handleDisconnect}
                accessibilityLabel="Add variant"
                icon={MinusCircleIcon}
                variant="primary"
                tone="critical"
              >
                Disconnect
              </Button>
            )}
          </InlineGrid>
          <Text>{connect ? "Account Connected" : "Click on connect button to activate"}</Text>
          <Text as="p" variant="bodyMd">
            Explore more features and functionalities on the{" "}
            <PolarisLink url="https://web-dev.gyatagpt.ai/dashboard" external>
              Gyata Try On
            </PolarisLink> Webapp.
          </Text>
        </BlockStack>
      ),
    },
    {
      id: 'configuration',
      content: 'Configuration',
      message: (
        <BlockStack gap="200">
          <InlineGrid columns="1fr auto">
            <Text as="h2" variant="headingSm">
              Configuration
            </Text>
            <Button
              onClick={() => { }}
              accessibilityLabel="Add variant"
              icon={SettingsIcon}
              variant="primary"
            >
              Configure
            </Button>
          </InlineGrid>
          <ConfigurationForm appId={appId} togle={togle} handleToggle={handleToggle} />
        </BlockStack>
      ),
    },
  ];

  return (
    <Page title="Gyata Try On">
      <Layout>
        <Layout.Section>
          <Tabs tabs={tabs} selected={selected} onSelect={handleTabChange}>
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 9, xl: 6 }}>
                <Card title={tabs[selected].content}>
                  <BlockStack>
                    {tabs[selected].message}
                  </BlockStack>
                </Card>
              </Grid.Cell>
            </Grid>
          </Tabs>
        </Layout.Section>
      </Layout>
      <BlockStack style={{ marginTop: '50px', textAlign: 'center' }}>
        <Text gap="400" style={{ marginTop: '50px', textAlign: 'center' }}>
          Need help? Visit our{" "}
          <Link to="https://gyatagpt.ai/contact-us/">
            support page
          </Link>.
        </Text>
      </BlockStack>
    </Page>
  );
}

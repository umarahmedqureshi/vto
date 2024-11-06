import {
    Card,
    Page,
    Layout,
    BlockStack,
    Text,
    Spinner,
    Button,
    Frame,
    Modal,
    FormLayout,
    TextField,
    Form,
    Toast,
} from "@shopify/polaris";
import { GroupsCard, GroupTable } from "./components";
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import header from "./utils/headers";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";


export const loader = async ({ request }) => {
    const { session } = await authenticate.admin(request);
    const shop = session.shop;
    console.log("shop ----- ",shop);

    const url = new URL(request.url);
    const page = url.searchParams.get("page") || "1"; // Default to page 1
    const headers = header;

    try {
        const response = await axios.get(`https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup?page=${page}`, { headers });
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

export default function Group() {
    const { data, err, page } = useLoaderData();
    console.log("data 9090 :: => ", data);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [showDetailsCard, setShowDetailsCard] = useState(false);
    const [active, setActive] = useState(false);
    const [groups, setGroups] = useState(data); // Initialize with loader data
    const [currentPage, setCurrentPage] = useState(Number(page));
    // const [currentPage, setCurrentPage] = useState(Number(data.current_page));
    const [error, setError] = useState(err);
    const [loading, setLoading] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    // Handle toast dismissal
    const dismissToast = useCallback(() => setDismissed(!dismissed), [dismissed]);

    // Handle modal open/close
    const handleChange = useCallback(() => setActive(!active), [active]);

    // Handle name and description changes
    const handleNameChange = useCallback((value) => setName(value), []);
    const handleDescriptionChange = useCallback((value) => setDescription(value), []);

    // Toast for success message
    const toastMarkup = dismissed ? (
        <Toast content="Group Updated" onDismiss={dismissToast} duration={2000} />
    ) : null;

    useEffect(() => {
        const fetchData = async (page) => {
            const headers = header;
            try {
                setLoading(true);
                const response = await axios.get(
                    `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup?page=${page}`,
                    { headers }
                );
                setGroups(response.data);
                setError(null);
            } catch (err) {
                setError('Something went wrong..!');
                // console.log(err);
                setGroups(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData(currentPage);
    }, [currentPage]);

    const handleNextPage = () => {
        if (groups && groups.data && groups.data.current_page < groups.data.last_page) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleCreateGroup = async (event) => {
        event.preventDefault();
        const headers = header;
        try {
            setLoading(true);
            const response = await axios.post(
                `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/creategroup`,
                { name, description },
                { headers }
            );
            console.log("handleCreateGroup response",response);
            
            if (response.data.success) {
                handleChange();
                setName("");
                setDescription("");
                const updatedGroups = await axios.get(
                    `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup?page=${currentPage}`,
                    { headers }
                );
                setGroups(updatedGroups.data);
            } else {
                console.error("Failed to create group:", response.data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Show details by group id
    const showDetailsGroup = (groupId) => {
        const group = groups.data.data.find((g) => g.id === groupId);
        setSelectedGroup(group);
        setShowDetailsCard(true);
    };

    console.log("g ::: - >",groups);
    return (
        <Frame>
            <Page
                fullWidth
                title={groups ? groups.message : "Loading..."}
                primaryAction={<Button primary onClick={handleChange}>Create Group</Button>}
            >
                <Layout>
                    <Layout.Section>
                        <Card sectioned>
                            {error ? (
                                <Text variant="headingMd" alignment="center" as="h2" tone="critical">
                                    {error}
                                </Text>
                            ) : loading ? (
                                <div style={{ textAlign: "center" }}>
                                    <Spinner accessibilityLabel="Loading groups data" size="large" />
                                </div>
                            ) : (
                                <BlockStack>                                    
                                    <GroupTable
                                        groups={groups.data.data}
                                        showDetailsGroup={showDetailsGroup}
                                        hasPrevious={currentPage > 1}
                                        onPrevious={handlePreviousPage}
                                        hasNext={groups.data.current_page < groups.data.last_page}
                                        onNext={handleNextPage}
                                        from={groups.data.from}
                                        to={groups.data.to}
                                        total={groups.data.total}
                                    />
                                </BlockStack>
                            )}
                        </Card>
                    </Layout.Section>
                    {showDetailsCard && (
                        <Layout.Section variant="oneThird">
                            <GroupsCard group={selectedGroup} setShowDetailsCard={setShowDetailsCard} setGroups={setGroups} currentPage={currentPage} />
                        </Layout.Section>
                    )}
                </Layout>
            </Page>
            {toastMarkup}
            <Modal open={active} onClose={handleChange} title="Create Group">
                <Modal.Section>
                    <BlockStack>
                        <Form onSubmit={handleCreateGroup}>
                            <FormLayout>
                                <TextField
                                    label="Group Name"
                                    value={name}
                                    autoComplete="off"
                                    type="text"
                                    onChange={handleNameChange}
                                />
                                <TextField
                                    label="Description"
                                    value={description}
                                    autoComplete="off"
                                    onChange={handleDescriptionChange}
                                />
                                <Button submit>Submit</Button>
                            </FormLayout>
                        </Form>
                    </BlockStack>
                </Modal.Section>
            </Modal>
        </Frame>
    );
    
}

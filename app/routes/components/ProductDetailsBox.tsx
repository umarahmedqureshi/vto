import React, { useState, useEffect, useCallback } from "react";
import {
    Box,
    Text,
    Form,
    FormLayout,
    TextField,
    Card,
    Scrollable,
    Spinner,
    Select,
    Button,
    Thumbnail,
    BlockStack,
} from "@shopify/polaris";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import axios from "axios";
import header from "../utils/headers";

interface Image {
    id: number;
    src: string;
    alt?: string;
    width: number;
    height: number;
}

interface Group {
    id: number;
    name: string;
}

export function ProductDetailsBox({ productId }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [productType, setProductType] = useState("");
    const [images, setImageData] = useState<Image[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<{
        label: string;
        value: string;
    } | null>(null);
    const [groups, setGroups] = useState<Group[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [disabled, setDisabled] = useState(true);

    // Fetch product details
    const {
        data: productResponseData,
        isLoading: isLoadingProduct,
        isRefetching: isRefetchingProduct,
    } = useAppQuery({
        url: `/api/products/${productId}`,
        reactQueryOptions: {
            onSuccess: (data: any) => {
                if (data) {
                    setTitle(data.responseBody.product.title);
                    setProductType(data.responseBody.product.product_type);
                    setDescription(data.responseBody.product.body_html);
                    setImageData(data.responseBody.product.images || []);
                    getGroupByProductId(data.responseBody.product.id);
                }
            },
            onError: () => {
                setError("Failed to fetch product data.");
            },
        },
    });

    // Fetch groups associated with the product
    const getGroupByProductId = async (productId: any) => {
        const headers = header;
        try {
            setLoading(true);
            const response = await axios.get(
                `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/group_by_product?product_id=["${productId}"]`,
                { headers },
            );

            if (response?.data.success) {
                const groupData = response.data.data[0];
                setSelectedGroup({
                    label: groupData.name,
                    value: groupData.id.toString(),
                });
                setDisabled(false);
            } else {
                setSelectedGroup({ label: "Select Group", value: "null" });
                setDisabled(true);
            }
        } catch (err) {
            // setError("Failed to fetch group data.");
            setSelectedGroup({ label: "Select Group", value: "null" });
            setDisabled(true);
        } finally {
            setLoading(false);
        }
    };

    // Fetch all groups
    useEffect(() => {
        const fetchGroups = async () => {
            const headers = header;
            try {
                const response = await axios.get(
                    `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup`,
                    { headers },
                );
                setGroups(response.data.data.data || []);
            } catch (err) {
                setError("Failed to fetch groups.");
            }
        };
        fetchGroups();
    }, []);

    // Assign product to selected group
    const handleAssignProducts = async (groupId, productId) => {
        const headers = header;
        try {
            setLoading(true);
            const productIds = Array.isArray(productId)
                ? productId
                : [productId];
            const response = await axios.post(
                `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/assigngroup`,
                {
                    product_id: JSON.stringify(productIds),
                    group_id: groupId,
                },
                { headers },
            );
            if (response.data.success) {
                // console.log("Product assigned to group successfully!", response.data,);
                setError(null);
                setDisabled(false);
            }
        } catch (err) {
            setError(err);
            setDisabled(true);
            // console.log("Error :: Assign Product :: ==>", err);
        } finally {
            setLoading(false);
        }
    };

    // De-Assign product from group
    const deAssignGroupByProductId = async (productId: any) => {
        const headers = header;
        try {
            setLoading(true);
            const productIds = Array.isArray(productId)
                ? productId
                : [productId];
            const response = await axios.post(
                ` https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/deassigngroup`,
                { product_id: JSON.stringify(productIds),},
                { headers },
            );
            if (response?.data) {
                // console.log("Success :: De Assign Product ==>", response.data);
                setSelectedGroup({ label: "Select Group", value: "null" });
                setDisabled(true);
            }
        } catch (err) {
            console.error("Error :: De-Assign Product :: ==>", err);
            setDisabled(false);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    // Handle group selection change
    const handleSelectChange = useCallback(
        (value: string) => {
            const selectedOption = groups.find(
                (group) => group.id.toString() === value,
            );
            if (selectedOption) {
                setSelectedGroup({ label: selectedOption.name, value });
                handleAssignProducts(value, productId);
            }
        },
        [groups],
    );

    const options = groups.map((group) => ({
        label: group.name,
        value: group.id.toString(),
    }));

    const handleDeassignProducts = () => {
        // console.log("handleDeassignProducts");
        deAssignGroupByProductId(productId);
    };
    if (isLoadingProduct || isRefetchingProduct) {
        return <Spinner accessibilityLabel="Loading..." size="large" />;
    }

    return (
        <Box
            background="bg-surface"
            borderColor="transparent"
            borderRadius="300"
            borderWidth="025"
        >
            <BlockStack>
                {error && (
                    <Text as="h5" tone="critical">
                        {error}
                    </Text>
                )}

                <Form
                    onSubmit={function (
                        event: React.FormEvent<HTMLFormElement>,
                    ): unknown {
                        throw new Error("Function not implemented.");
                    }}
                >
                    <FormLayout>
                        <TextField
                            label="Title"
                            value={title}
                            autoComplete="off"
                            disabled
                        />
                        <Text variant="bodyMd" as="p">
                            Description
                        </Text>
                        <Card>
                            <Scrollable
                                shadow
                                style={{ height: "100px" }}
                                focusable
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: description,
                                    }}
                                />
                            </Scrollable>
                        </Card>
                        <TextField
                            label="Product Type"
                            value={productType}
                            autoComplete="off"
                            disabled
                        />
                        <Select
                            label="Assigned Model Group"
                            options={[
                                { label: "Select Group", value: "null" },
                                ...options,
                            ]}
                            onChange={handleSelectChange}
                            value={selectedGroup?.value || "null"}
                        />
                        <Button
                            onClick={handleDeassignProducts}
                            variant="primary"
                            disabled={disabled}
                        >
                            {" "}
                            {loading ? "Loading..." : "Remove Group"}
                        </Button>
                        <Text variant="bodyMd" as="p">
                            Images
                        </Text>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "1rem",
                            }}
                        >
                            {images.map((image, index) => (
                                <Thumbnail
                                    key={image.id || index}
                                    source={image.src}
                                    size="large"
                                    alt={image.alt || `Image of ${title}`}
                                />
                            ))}
                        </div>
                    </FormLayout>
                </Form>
            </BlockStack>
        </Box>
    );
}

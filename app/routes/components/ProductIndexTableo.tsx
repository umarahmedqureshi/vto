import {
    IndexFilters,
    IndexTable,
    Card,
    useIndexResourceState,
    useSetIndexFiltersMode,
    Text,
    useBreakpoints,
    Filters,
    TextField,
    Pagination,
    Button,
    Spinner,
} from "@shopify/polaris";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import React, { useState, useCallback, useEffect } from "react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductIndexTable({
    showDetails,
    setIsButtonEnabled,
    sendArrayToParent,
}: {
    showDetails: (array: any[]) => void;// assuming this is a boolean
    setIsButtonEnabled: (enabled: boolean) => void; // function that takes a boolean
    sendArrayToParent: (array: any[]) => void; // assuming this sends an array
}) {
    const [nextPageInfo, setNextPageInfo] = useState(null);
    const [previousPageInfo, setPreviousPageInfo] = useState(null);
    const [limit] = useState(10);
    const [queryValue, setQueryValue] = useState("");
    const [taggedWith, setTaggedWith] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [paginationLable, setPaginationLable] = useState("---");
    const [firstNo, setFirstNuber] = useState(1);
    const [secNo, setSecondNuber] = useState(limit);
    const [products, setProducts] = useState<Product[]>([]);
    const [productsData, setProductsData] = useState([]);
    const [productsResponse, setProductsResponse] = useState([]);
    const [totalProductsCount, setProductsCount] = useState("");
    const [loadingSpiner, setLoadingSpiner] = useState(true);
    const { mode, setMode } = useSetIndexFiltersMode();

    const [accountStatus, setAccountStatus] = useState<string[] | undefined>(
        undefined,
    );

    const [moneySpent, setMoneySpent] = useState<[number, number] | undefined>(
        undefined,
    );

    const fetch = useAuthenticatedFetch();

    const sortOptions: IndexFiltersProps["sortOptions"] = [
        {
            label: "Product Name",
            value: "product name asc",
            directionLabel: "Ascending",
        },
        {
            label: "Product Name",
            value: "product name desc",
            directionLabel: "Descending",
        },
        {
            label: "Product Type",
            value: "product type asc",
            directionLabel: "A-Z",
        },
        {
            label: "Product Type",
            value: "product type desc",
            directionLabel: "Z-A",
        },
        { label: "Status", value: "status asc", directionLabel: "A-Z" },
        { label: "Status", value: "status desc", directionLabel: "Z-A" },
    ];

    const [sortSelected, setSortSelected] = useState(["product asc"]);
    const [selected, setSelected] = useState(0);
    const handleFiltersQueryChange = useCallback(
        (value: string) => setQueryValue(value),
        [],
    );
    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
    const [itemStrings, setItemStrings] = useState([
        "All",
        "Active",
        "Draft",
        "Archived",
    ]);

    const onCreateNewView = async (value: string) => {
        await sleep(500);
        setItemStrings([...itemStrings, value]);
        setSelected(itemStrings.length);
        return true;
    };

    const onHandleSave = async () => {
        await sleep(1);
        return true;
    };
    const onHandleCancel = () => {};
    const primaryAction: IndexFiltersProps["primaryAction"] =
        selected === 0
            ? {
                  type: "save-as",
                  onAction: onCreateNewView,
                  disabled: false,
                  loading: false,
              }
            : {
                  type: "save",
                  onAction: onHandleSave,
                  disabled: false,
                  loading: false,
              };

    const filters = [
        {
            key: "taggedWith",
            label: "Tagged with",
            filter: (
                <TextField
                    value={taggedWith}
                    onChange={(value) => setTaggedWith(value)}
                    label="Tagged with"
                    labelHidden
                    autoComplete="off"
                />
            ),
        },
    ];

    const appliedFilters = taggedWith
        ? [
              {
                  key: "taggedWith",
                  label: `Tagged with ${taggedWith}`,
                  onRemove: () => setTaggedWith(""),
              },
          ]
        : [];

    const handleAccountStatusRemove = useCallback(
        () => setAccountStatus(undefined),
        [],
    );

    const handleMoneySpentRemove = useCallback(
        () => setMoneySpent(undefined),
        [],
    );

    const handleTaggedWithRemove = useCallback(() => setTaggedWith(""), []);
    const handleQueryValueRemove = useCallback(() => setQueryValue(""), []);

    const handleFiltersClearAll = useCallback(() => {
        handleAccountStatusRemove();
        handleMoneySpentRemove();
        handleTaggedWithRemove();
        handleQueryValueRemove();
    }, [
        handleAccountStatusRemove,
        handleMoneySpentRemove,
        handleQueryValueRemove,
        handleTaggedWithRemove,
    ]);

    const handleStatusChange = (status: string) => {
        if (status === "All") {
            setSelectedStatus(null);
        } else {
            // console.log("status: ", status);
            setSelectedStatus(status.toLowerCase());
        }
    };

    const tabs: TabProps[] = itemStrings.map((item, index) => ({
        content: item,
        index,
        onAction: () => {
            handleStatusChange(item);
        },
        id: `${item}-${index}`,
        isLocked: index === 0,
        actions: index === 0 ? [] : [],
    }));

    const filteredProducts = products.filter((product) => {
        if (!selectedStatus) return true;
        return product.status.toLowerCase() === selectedStatus;
    });

    interface Product {
        id: string;
        product: string;
        productType: string;
        status: string;
        [key: string]: unknown;
    }

    interface ResponseProduct {
        id: number;
        title: string;
        product_type: string;
        status: string;
    }

    const transformProducts = (
        responseProducts: ResponseProduct[],
    ): Product[] => {
        return responseProducts.map((product) => ({
            id: product.id.toString(),
            product: product.title,
            productType: product.product_type,
            status: product.status,
        }));
    };

    const fetchProductsWithPageInfo = async (
        limit: number,
        page_Info: string | null,
    ) => {
        const url = `/api/products?limit=${limit}${page_Info ? `&page_info=${page_Info}` : ""}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(
                    `Error fetching products: ${response.statusText}`,
                );
            }
            const data = await response.json();

            if (!data || !data.responseBody) {
                throw new Error(
                    "Response does not contain expected responseBody",
                );
            }

            const transformedProducts = transformProducts(
                data.responseBody.products,
            );
            return {
                transformedProducts,
                data,
            };
        } catch (error) {
            console.error("Error fetching products with page info:", error);
            throw error;
        }
    };

    const {
        data: productResponseData,
        refetch: refetchProduct,
        isLoading: isLoadingCount,
        isRefetching: isRefetchingCount,
    } = useAppQuery({
        url: `/api/products?limit=${limit}`,
        reactQueryOptions: {
            onSuccess: async (data) => {
                try {
                    const [totalCountResponse] = await Promise.all([
                        fetch("/api/products/count").then((response) => {
                            if (!response.ok) {
                                throw new Error(
                                    `Error fetching total count: ${response.statusText}`,
                                );
                            }
                            return response.json();
                        }),
                    ]);
                    setLoadingSpiner(false);
                    setPaginationLable(
                        `1 - ${limit} of ${totalCountResponse.count} products`,
                    );
                    setProductsCount(totalCountResponse.count);
                    const transformedProducts = transformProducts(
                        data.responseBody.products,
                    );
                    setProducts(transformedProducts);
                    setProductsData(data.responseBody.products);
                    setProductsResponse(data);
                    if (data.nextPage != null && data.nextPage != undefined) {
                        setNextPageInfo(data.nextPage);
                    }
                    if (
                        data.previousPage != null &&
                        data.previousPage != undefined
                    ) {
                        setPreviousPageInfo(data.previousPage);
                    }
                } catch (error) {
                    console.error(
                        "Error fetching products or total count:",
                        error,
                    );
                }
            },
            onError: () => {},
        },
    });

    const resourceName = {
        singular: "product",
        plural: "products",
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(products);
    // console.log("selected res: ", selectedResources);
    sendArrayToParent(selectedResources);

    if (selectedResources.length === 0) {
        setIsButtonEnabled(false);
    } else {
        // handleSelectedData(selectedResources);
        setIsButtonEnabled(selectedResources.length > 0);
    }

    const handleNextPage = async () => {
        try {
            const { transformedProducts, data } =
                await fetchProductsWithPageInfo(limit, nextPageInfo);
            setProducts(transformedProducts);
            setProductsData(data.responseBody.products);
            setNextPageInfo(data.nextPage || null);
            setPreviousPageInfo(data.previousPage || null);
            const newFirstNo = firstNo + limit;
            const newSecNo = secNo + limit;
            setPaginationLable(
                `${newFirstNo} - ${newSecNo} of ${totalProductsCount} products`,
            );
            setFirstNuber(newFirstNo);
            setSecondNuber(newSecNo);
        } catch (error) {
            console.error("Failed to fetch next page of products:", error);
        }
    };

    const handlePreviousPage = async () => {
        try {
            const { transformedProducts, data } =
                await fetchProductsWithPageInfo(limit, previousPageInfo);
            setProducts(transformedProducts);
            setProductsData(data.responseBody.products);
            setNextPageInfo(data.nextPage || null);
            setPreviousPageInfo(data.previousPage || null);
            const newFirstNo = firstNo - limit;
            const newSecNo = secNo - limit;
            setPaginationLable(
                `${newFirstNo} - ${newSecNo} of ${totalProductsCount} products`,
            );
            setFirstNuber(newFirstNo);
            setSecondNuber(newSecNo);
        } catch (error) {
            console.error("Failed to fetch next page of products:", error);
        }
    };

    const handleRowClick = (id: string) => {
        showDetails(id);
    };

    const rowMarkup = filteredProducts.map(
        ({ id, product, productType, status }, index) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
                onClick={() => {
                    handleRowClick(id);
                }}
            >
                <IndexTable.Cell>{product}</IndexTable.Cell>
                <IndexTable.Cell>{productType}</IndexTable.Cell>
                <IndexTable.Cell>{status}</IndexTable.Cell>
                <IndexTable.Cell>{`---`}</IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    const isCondensed = useBreakpoints().smDown;

    return (
        <Card>
            <IndexFilters
                sortOptions={sortOptions}
                sortSelected={sortSelected}
                queryValue={queryValue}
                queryPlaceholder="Searching all Products..."
                onQueryChange={handleFiltersQueryChange}
                onQueryClear={() => setQueryValue("")}
                onSort={setSortSelected}
                primaryAction={primaryAction}
                cancelAction={{
                    onAction: onHandleCancel,
                    disabled: false,
                    loading: false,
                }}
                tabs={tabs}
                selected={selected}
                onSelect={setSelected}
                canCreateNewView
                onCreateNewView={onCreateNewView}
                filters={filters}
                appliedFilters={appliedFilters}
                onClearAll={handleFiltersClearAll}
                mode={mode}
                setMode={setMode}
            />
            {!loadingSpiner ? (
                <>
                    <IndexTable
                        condensed={isCondensed}
                        resourceName={resourceName}
                        itemCount={filteredProducts.length}
                        selectedItemsCount={
                            allResourcesSelected
                                ? "All"
                                : selectedResources.length
                        }
                        onSelectionChange={handleSelectionChange}
                        headings={[
                            { title: "Product Name" },
                            { title: "Product Type" },
                            { title: "Status" },
                            { title: "Group" },
                        ]}
                    >
                        {rowMarkup}
                    </IndexTable>
                </>
            ) : (
                <div style={{ textAlign: "center", margin: "1rem 0rem" }}>
                    <Spinner accessibilityLabel="Spinner" size="large" />
                </div>
            )}
            <Pagination
                hasPrevious={Boolean(previousPageInfo)}
                onPrevious={handlePreviousPage}
                hasNext={Boolean(nextPageInfo)}
                onNext={handleNextPage}
                type="table"
                label={paginationLable}
            />
        </Card>
    );
}

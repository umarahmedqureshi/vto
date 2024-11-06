import {
    IndexFilters,
    IndexTable,
    Card,
    useIndexResourceState,
    useSetIndexFiltersMode,
    TextField,
    Pagination,
    Button,
    Spinner,
} from "@shopify/polaris";
import React, { useState, useCallback, useEffect } from "react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductIndexTable({
    showDetails,
    setIsButtonEnabled,
    sendArrayToParent,
}) {
    const [nextPageInfo, setNextPageInfo] = useState(null);
    const [previousPageInfo, setPreviousPageInfo] = useState(null);
    const [limit] = useState(10);
    const [queryValue, setQueryValue] = useState("");
    const [taggedWith, setTaggedWith] = useState("");
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [paginationLable, setPaginationLable] = useState("---");
    const [firstNo, setFirstNuber] = useState(1);
    const [secNo, setSecondNuber] = useState(limit);
    const [products, setProducts] = useState([]);
    const [productsData, setProductsData] = useState([]);
    const [productsResponse, setProductsResponse] = useState([]);
    const [totalProductsCount, setProductsCount] = useState("");
    const [loadingSpiner, setLoadingSpiner] = useState(true);
    const { mode, setMode } = useSetIndexFiltersMode();

    const [accountStatus, setAccountStatus] = useState(undefined);
    const [moneySpent, setMoneySpent] = useState(undefined);

    const fetch = useAuthenticatedFetch();

    const sortOptions = [
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
        (value) => setQueryValue(value),
        [],
    );

    const sleep = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));

    const [itemStrings, setItemStrings] = useState([
        "All",
        "Active",
        "Draft",
        "Archived",
    ]);

    const onCreateNewView = async (value) => {
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

    const primaryAction =
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

    const handleStatusChange = (status) => {
        if (status === "All") {
            setSelectedStatus(null);
        } else {
            setSelectedStatus(status.toLowerCase());
        }
    };

    const tabs = itemStrings.map((item, index) => ({
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

    const transformProducts = (responseProducts) => {
        return responseProducts.map((product) => ({
            id: product.id.toString(),
            product: product.title,
            productType: product.product_type,
            status: product.status,
        }));
    };

    const fetchProductsWithPageInfo = async (limit, page_Info) => {
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

    sendArrayToParent(selectedResources);

    if (selectedResources.length === 0) {
        setIsButtonEnabled(false);
    } else {
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
            console.error("Failed to fetch previous page of products:", error);
        }
    };

    const rowMarkup = filteredProducts.map(
        ({ id, product, productType, status }, index) => (
            <IndexTable.Row
                id={id}
                key={id}
                position={index}
                selected={selectedResources.includes(id)}
            >
                <IndexTable.Cell>{product}</IndexTable.Cell>
                <IndexTable.Cell>{productType}</IndexTable.Cell>
                <IndexTable.Cell>{status}</IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Card>
            <IndexFilters
                queryValue={queryValue}
                queryPlaceholder="Searching in all"
                // queryFieldHidden
                onQueryChange={handleFiltersQueryChange}
                onQueryClear={handleQueryValueRemove}
                queryFieldHidden={mode === "save"}
                sortOptions={sortOptions}
                sortSelected={sortSelected}
                primaryAction={primaryAction}
                tabs={tabs}
                selected={selected}
                canCreateNewView
                filters={filters}
                appliedFilters={appliedFilters}
                onClearAll={handleFiltersClearAll}
            />
            <IndexTable
                resourceName={resourceName}
                itemCount={products.length}
                selectedItemsCount={
                    allResourcesSelected ? "All" : selectedResources.length
                }
                headings={[
                    { title: "Product" },
                    { title: "Type" },
                    { title: "Status" },
                ]}
                selectable
                onSelectionChange={handleSelectionChange}
            >
                {rowMarkup}
            </IndexTable>
            {loadingSpiner && <Spinner accessibilityLabel="Spinner Example" />}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Button onClick={handlePreviousPage}>Previous</Button>
                <Pagination
                    label={paginationLable}
                    hasPrevious={previousPageInfo}
                    onPrevious={handlePreviousPage}
                    hasNext={nextPageInfo}
                    onNext={handleNextPage}
                />
                <Button onClick={handleNextPage}>Next</Button>
            </div>
        </Card>
    );
}

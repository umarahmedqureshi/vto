import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  IndexFilters,
  IndexTable,
  Card,
  useIndexResourceState,
  useSetIndexFiltersMode,
  Text,
  Spinner,
  Pagination,
  TextField
} from '@shopify/polaris';
import { debounce } from 'lodash';
import { useAppQuery, useAuthenticatedFetch } from '../hooks';

export function ProductsTable({ toggleVisibility }) {
  const [PageInfo, setPageInfo] = useState(null);
  const [nextPageInfo, setNextPageInfo] = useState(null);
  const [previousPageInfo, setPreviousPageInfo] = useState(null);
  const [limit] = useState(10); // Reduced limit for initial load
  const [queryValue, setQueryValue] = useState('');
  const [taggedWith, setTaggedWith] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [paginationLabel, setPaginationLabel] = useState('---');
  const [firstNo, setFirstNo] = useState(1);
  const [secondNo, setSecondNo] = useState(10);
  const [products, setProducts] = useState([]);
  const [loadingSpinner, setLoadingSpinner] = useState(true);
  const { mode, setMode } = useSetIndexFiltersMode();
  const fetch = useAuthenticatedFetch();

  const sortOptions = [
    { label: 'Product Name', value: 'product name asc', directionLabel: 'Ascending' },
    { label: 'Product Name', value: 'product name desc', directionLabel: 'Descending' },
    { label: 'Product Type', value: 'product type asc', directionLabel: 'A-Z' },
    { label: 'Product Type', value: 'product type desc', directionLabel: 'Z-A' },
    { label: 'Status', value: 'status asc', directionLabel: 'A-Z' },
    { label: 'Status', value: 'status desc', directionLabel: 'Z-A' }
  ];

  const [sortSelected, setSortSelected] = useState(['product asc']);
  const [selected, setSelected] = useState(0);
  const [itemStrings, setItemStrings] = useState(['All', 'Active', 'Draft', 'Archived']);

  const handleFiltersQueryChange = useCallback(debounce((value) => setQueryValue(value), 300), []);
  
  const onCreateNewView = async (value) => { 
    await new Promise((resolve) => setTimeout(resolve, 500)); 
    setItemStrings([...itemStrings, value]); 
    setSelected(itemStrings.length); 
    return true; 
  };

  const onHandleSave = async () => { await new Promise((resolve) => setTimeout(resolve, 1)); return true; };  
  const onHandleCancel = () => {};  

  const primaryAction = selected === 0
    ? {
        type: 'save-as',
        onAction: onCreateNewView,
        disabled: false,
        loading: false,
      }
    : {
        type: 'save',
        onAction: onHandleSave,
        disabled: false,
        loading: false,
      };

  const filters = [
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          value={taggedWith}
          onChange={setTaggedWith}
          label="Tagged with"
          labelHidden
          autoComplete="off"
        />
      ),
    },
  ];

  const appliedFilters = taggedWith
    ? [{
        key: 'taggedWith',
        label: `Tagged with ${taggedWith}`,
        onRemove: () => setTaggedWith(''),
      }]
    : [];

  const handleStatusChange = (status) => {
    if (status === 'All') {
      setSelectedStatus(null);
    } else {
      setSelectedStatus(status.toLowerCase());
    }
  };

  const tabs = itemStrings.map((item, index) => ({
    content: item,
    index,
    onAction: () => handleStatusChange(item),
    id: `${item}-${index}`,
    isLocked: index === 0,
  }));

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (!selectedStatus) return true;
      return product.status.toLowerCase() === selectedStatus;
    });
  }, [products, selectedStatus]);

  const fetchProductsWithPageInfo = async (limit, pageInfo) => {
    const url = `/api/products?limit=${limit}${pageInfo ? `&page_info=${pageInfo}` : ''}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching products: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data || !data.responseBody) {
        throw new Error('Response does not contain expected responseBody');
      }
      return {
        transformedProducts: transformProducts(data.responseBody.products),
        data
      };
    } catch (error) {
      console.error('Error fetching products with page info:', error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { transformedProducts, data } = await fetchProductsWithPageInfo(limit, null);
        setProducts(transformedProducts);
        setLoadingSpinner(false);
        setPaginationLabel(`1 - ${limit} of ${data.totalCount} products`);
        setNextPageInfo(data.nextPage);
        setPreviousPageInfo(data.previousPage);
      } catch (error) {
        console.error('Error fetching initial products:', error);
      }
    };

    fetchData();
  }, [limit]);

  const handleNextPage = async () => {
    if (!nextPageInfo) return;
    try {
      const { transformedProducts, data } = await fetchProductsWithPageInfo(limit, nextPageInfo);
      setProducts((prevProducts) => [...prevProducts, ...transformedProducts]);
      setNextPageInfo(data.nextPage);
      setPreviousPageInfo(data.previousPage);
      setPaginationLabel(`${firstNo + limit} - ${secondNo + limit} of ${data.totalCount} products`);
      setFirstNo(firstNo + limit);
      setSecondNo(secondNo + limit);
    } catch (error) {
      console.error('Failed to fetch next page of products:', error);
    }
  };

  const handlePreviousPage = async () => {
    if (!previousPageInfo) return;
    try {
      const { transformedProducts, data } = await fetchProductsWithPageInfo(limit, previousPageInfo);
      setProducts((prevProducts) => [...transformedProducts, ...prevProducts]);
      setNextPageInfo(data.nextPage);
      setPreviousPageInfo(data.previousPage);
      setPaginationLabel(`${firstNo - limit} - ${secondNo - limit} of ${data.totalCount} products`);
      setFirstNo(firstNo - limit);
      setSecondNo(secondNo - limit);
    } catch (error) {
      console.error('Failed to fetch previous page of products:', error);
    }
  };

  const handleRowClick = (id) => {
    toggleVisibility(id);
  };

  const rowMarkup = filteredProducts.map(
    ({ id, product, productType, status }, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
        onClick={() => handleRowClick(id)}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {product}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{productType}</IndexTable.Cell>
        <IndexTable.Cell>{status}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const isCondensed = useBreakpoints().smDown;
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState(products);

  return (
    <Card>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Searching all Products..."
        onQueryChange={handleFiltersQueryChange}
        onQueryClear={() => setQueryValue('')}
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
      {loadingSpinner ? (
        <div style={{ textAlign: 'center', margin: '1rem 0rem' }}>
          <Spinner accessibilityLabel="Spinner" size="large" />
        </div>
      ) : (
        <>
          <IndexTable
            condensed={isCondensed}
            resourceName={{ singular: 'product', plural: 'products' }}
            itemCount={filteredProducts.length}
            selectedItemsCount={allResourcesSelected ? 'All' : selectedResources.length}
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: 'Product Name' },
              { title: 'Product Type' },
              { title: 'Status' }
            ]}
          >
            {rowMarkup}
          </IndexTable>
          <Pagination
            hasPrevious={!!previousPageInfo}
            hasNext={!!nextPageInfo}
            onPrevious={() => handlePreviousPage()}
            onNext={() => handleNextPage()}
            label={paginationLabel}
          />
        </>
      )}
    </Card>
  );
}

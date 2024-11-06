import { useState, useEffect } from 'react';
import { IndexTable, Card, Button } from '@shopify/polaris';
import { useLoaderData } from "@remix-run/react";

// // Loader for fetching data
// export const loader = async ({ request }) => {

//     try {
//         const response = await fetch('/api/products'); // Modify API endpoint as needed
//         const data = await response.json();
//         console.log("data from indextableproducts adss",data);


//       return json({ dehhhh: response });
//     } catch (error) {
//       throw new Response("Something went wrong", { status: 500 });
//     }
// };

export function ProductIndexTable({ showDetails, setIsButtonEnabled, sendArrayToParent }){
  const [selectedItems, setSelectedItems] = useState([]);
  const [products, setProducts] = useState([]);
  const productData = useLoaderData();
  console.log("data from indextableproducts 1",productData);


  // Example to fetch products - you may replace it with your actual data fetching logic
  useEffect(() => {
    async function fetchProducts() {
      const response = await fetch(productData.shop+'/api/products'); // Modify API endpoint as needed
      const data = await response.json();
      console.log("data from indextableproducts",data);
      
      setProducts(data);
    }
    fetchProducts();
  }, []);

  const handleSelectionChange = (selectedIds) => {
    setSelectedItems(selectedIds);
    sendArrayToParent(selectedIds); // Pass selected items back to parent
    setIsButtonEnabled(selectedIds.length > 0); // Enable button if any product is selected
  };

  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row
      id={product.id}
      key={product.id}
      selected={selectedItems.includes(product.id)}
      position={index}
    >
      <IndexTable.Cell>
        <Button plain onClick={() => showDetails(product.id)}>
          {product.title}
        </Button>
      </IndexTable.Cell>
      <IndexTable.Cell>{product.price}</IndexTable.Cell>
      <IndexTable.Cell>{product.status}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Card>
      <IndexTable
        resourceName={{ singular: 'product', plural: 'products' }}
        itemCount={products.length}
        selectedItemsCount={selectedItems.length}
        onSelectionChange={handleSelectionChange}
        headings={[
          { title: 'Title' },
          { title: 'Price' },
          { title: 'Status' },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </Card>
  );
};

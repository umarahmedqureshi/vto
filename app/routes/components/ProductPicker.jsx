import React, { useState, useCallback } from 'react';
// import { ResourcePicker } from '@shopify/app-bridge';
// import { ResourcePicker } from '@shopify/polaris';
import pkg from '@shopify/app-bridge';
const { ResourcePicker } = pkg;
import { Button, Modal, BlockStack} from '@shopify/polaris';
 
export function ProductPicker() {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
 
  const handleSelection = (resources) => {
    const product = resources.selection[0]; // Since only one product is allowed, take the first one
    setSelectedProduct(product);
    setOpen(false); // Close modal after selection
  };
 
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
 
  return (
    <div>
      <Button onClick={handleOpen}>Select Product</Button>
      <ResourcePicker
        resourceType="Product"
        open={open}
        onSelection={handleSelection}
        onCancel={handleClose}
        allowMultiple={false} // Only one product can be selected
        showVariants={false} // If you don't want to show variants
      />
 
      {selectedProduct && (
        <Modal
          open={true}
          onClose={() => setSelectedProduct(null)}
          title="Selected Product"
        >
          <Modal.Section>
            <BlockStack >
              <img
                src={selectedProduct.images[0]?.originalSrc}
                alt={selectedProduct.title}
                width="50"
              />
              <p>{selectedProduct.title}</p>
            </BlockStack >
          </Modal.Section>
        </Modal>
      )}
    </div>
  );
}
 

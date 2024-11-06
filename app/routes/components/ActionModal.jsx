import { useState, useCallback } from 'react';
import { Button, Modal, BlockStack, Thumbnail } from '@shopify/polaris';

export function ActionModal({ imageURL, alt }) {
  const [active, setActive] = useState(false);
  const handleChange = useCallback(() => setActive(!active), [active]);
  const activator = <Button onClick={handleChange} variant="plain"><Thumbnail source={imageURL} size="medium" alt={alt} /></Button>;
  return (
    <Modal
      activator={activator}
      open={active}
      onClose={handleChange}
    // title="Reach more shoppers with Instagram product tags"
    >
      <Modal.Section>
        <BlockStack>
          <img
            alt={alt ? alt : 'ALT tag not found'}
            width="100%"
            height="100%"
            src={imageURL}
            style={{
              objectFit: 'contain',
              objectPosition: 'center',
            }}
          />
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
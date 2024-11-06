import { Modal } from '@shopify/polaris';
import React, { useState } from 'react';
export function GroupAssignmentModal({ isOpen, onClose, groups, onAssign }) {
  const [selectedGroup, setSelectedGroup] = useState(null);

  const handleGroupChange = (group) => {
    setSelectedGroup(group);
  };

  const handleAssign = () => {
    onAssign(selectedGroup);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Assign Group"
      primaryAction={{
        content: 'Assign',
        onAction: handleAssign,
        disabled: !selectedGroup,
      }}
      secondaryActions={[
        {
          content: 'Cancel',
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        {groups.map((group) => (
          <GroupsCard key={group.id} group={group} onClick={() => handleGroupChange(group)} />
        ))}
      </Modal.Section>
    </Modal>
  );
}
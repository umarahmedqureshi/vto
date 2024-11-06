import { BlockStack, Button, ButtonGroup, Card, InlineGrid, Text, Thumbnail, InlineStack, List, TextField, Modal } from '@shopify/polaris';
import { DeleteIcon, XIcon } from '@shopify/polaris-icons';
import { useState, useEffect, useCallback } from 'react';
import formatDate from '../utils/formatDate';
import { ActionModal } from "./ActionModal";
import "../assets/style.css";
import axios from 'axios';
import header from '../utils/headers';

import { useLoaderData } from "@remix-run/react";
import { ModalsIndexTable } from "./ModalsIndexTable";


export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "1";
  const headers = header;

  try {
    const response = await axios.get(`https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/models_list?page=${page}`, { headers });
    console.log("modal response", response);
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

export function GroupsCard({ group, setShowDetailsCard, setGroups, currentPage }) {
  const { data, err, page } = useLoaderData();

  // const [error, setError] = useState(err);
  const [modals, setModals] = useState(data);
  // const [loading, setLoading] = useState(false);
  const [currentPage1, setCurrentPage] = useState(Number(page));
  console.log("ModalsPage currentPage",currentPage1);

  useEffect(() => {
    const fetchData = async (page) => {
      const headers = header;
      try {
        setLoading(true);
        const response = await axios.get(
          `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/models_list?page=${page}`,
          { headers }
        );
        setModals(response.data);
        // setError(null);
      } catch (err) {
        // setError('Something went wrong..!');
        console.log(err);
        setModals(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData(currentPage1);
  }, [currentPage1]);
    
  const handleNextPage = () => {
    if (modals && modals.data && modals.data.current_page < modals.data.last_page) {
      setCurrentPage(currentPage1 + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage1 > 1) {
      setCurrentPage(currentPage1 - 1);
    }
  };
  
  // State to track modal open/close
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Function to handle modal open
  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  // Function to handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleChange = (newName) => {
    setNewName(newName)
    setActive(true);
  }
  useEffect(() => {
    setNewName(group.name);
  }, [group.name]);



  const [active, setActive] = useState(false);
  const [newName, setNewName] = useState(group.name);
  const [loading, setLoading] = useState(false);


  function handleDeleteGroup(groupId) {
    // console.log("Delete group function called :: ", groupId);
    const deleteGroup = async (groupId) => {
      const headers = header;
      const body = {
        "group_id": groupId
      }
      try {
        setLoading(true);
        const response = await axios.post(
          `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/delete_group`, body,
          { headers }
        );
        // console.log("Update group response:", response);
        if (response.status === 200) {
          const updatedGroups = await axios.get(
            `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup?page=${currentPage}`,
            { headers }
          );
          // console.log(" refresg  Updated groups:", updatedGroups);
          setGroups(updatedGroups.data);
          setShowDetailsCard(false);
        } else {
          console.error('Failed to update group againe:', response.data.message);
        }
      } catch (err) {
        // console.log(err);
      } finally {
        setActive(false);
        setLoading(false);
      }
    }
    deleteGroup(groupId);
  }

  function handleUpdateGroup(groupId, newName) {
    const updateGroupName = async (groupId, newName) => {
      const headers = header;
      const body = {
        "group_id": groupId,
        "name": newName
      }

      try {
        setLoading(true);
        const response = await axios.post(
          `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/updategroup`, body,
          { headers }
        );
        // console.log("Update group response:", response.data);
        if (response.data.success) {
          const updatedGroups = await axios.get(
            `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup?page=${currentPage}`,
            { headers }
          );
          setGroups(updatedGroups.data);
          setNewName(newName);
          setShowDetailsCard(false);
        } else {
          console.error('Failed to update group:', response.data.message);
        }
      } catch (err) {
        // console.log(err);
      } finally {
        setActive(false);
        setLoading(false);
      }
    };
    updateGroupName(groupId, newName);
  }

  return (
    <Card roundedAbove="sm">
      <BlockStack gap={400}>
        <InlineGrid columns="1fr auto">
          <Text as="h2" variant="headingSm">Group Details </Text>
          <Button variant='tertiary'
            icon={XIcon}
            onClick={() => { setShowDetailsCard(false) }}
          />
        </InlineGrid>
      </BlockStack>
      <BlockStack gap='200'>
        <List>
          <List.Item><Text as="h2" variant="headingSm">Group Id : {group.id}</Text></List.Item>
          <List.Item><Text as="span" variant="headingSm">Created At : </Text> {formatDate(group.created_at)}</List.Item>
          <List.Item><Text as="span" variant="headingSm" >Description: </Text>{group.description}</List.Item>
        </List>
        <TextField
          label="Group Name"
          value={newName}
          autoComplete="off"
          onChange={handleChange}
        />
        <div style={{ display: "flex", flex: "wrap", gap: "4px", marginBottom: "1rem" }}>
          {group.physical_models && group.physical_models.length > 0  ?
            (group.physical_models.map((image, index) =>
              <div key={index}>
                <ActionModal imageURL={image.url} alt={image.name} />
              </div>)
            ):(
              <>
              {/* Button to open the modal */}
              <Button onClick={handleModalOpen}>Assign Modal</Button>
    
              {/* Modal that shows when the button is clicked */}
              {isModalOpen && (
                <Modal
                  open={isModalOpen}
                  onClose={handleModalClose}
                  title="Assign Modal"
                >
                  <Modal.Section>
                    <ModalsIndexTable
                      group_id={group.id}
                      setIsModalOpen={setIsModalOpen}
                      modals={modals.data.data}
                      hasPrevious={currentPage1 > 1}
                      onPrevious={handlePreviousPage}
                      hasNext={modals.data.current_page < modals.data.last_page}
                      onNext={handleNextPage}
                      from={modals.data.from}
                      to={modals.data.to}
                      total={modals.data.total}
                    />
                  </Modal.Section>
                </Modal>
              )}
              </>
            )
          }
        </div>
      </BlockStack>
      <BlockStack gap='400'>
        <InlineStack align="end">
          <ButtonGroup>
            // Hidden bdelete button for temprory purpose
            <Button
              icon={DeleteIcon}
              variant="secondary"
              tone="critical"
              // TODO : Here we need to call the delete group function
              onClick={() => { handleDeleteGroup(group.id) }}
              accessibilityLabel="Delete"
            >Delete</Button>
            {active && (
              <Button
                variant="primary"
                onClick={() => { handleUpdateGroup(group.id, newName) }}
                disabled={loading}
                accessibilityLabel="Edit"
              >{loading ? "loading..." : "Update"}</Button>
            )}
          </ButtonGroup>
        </InlineStack>
      </BlockStack>
    </Card>
  )
}

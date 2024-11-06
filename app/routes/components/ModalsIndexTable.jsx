import {
    IndexTable,
    Link,
    BlockStack,
    EmptySearchResult,
    Thumbnail,
    useIndexResourceState,
} from "@shopify/polaris";
import React from "react";
import formatDate from '../utils/formatDate';
import "../assets/style.css";

import header from "../utils/headers";
import axios from "axios";
// import { json } from "@remix-run/node";


export function ModalsIndexTable({ group_id, setIsModalOpen, modals, hasNext, hasPrevious, onNext, onPrevious, from, to, total }) {
    console.log("ModalsIndexTable modals ", modals);

    const handleAssignModals = async () => {
        const headers = header;

        const modelIds = selectedResources.map(id => parseInt(id, 10));
        const model_id = JSON.stringify(modelIds);
        console.log("ModalsIndexTable modelIds ", model_id);

        try {
            // setLoading(true);
            const response = await axios.post(
                `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/assign_model_group`,
                { group_id, model_id},
                { headers }
            );
            console.log("handleAssignModals response",response);
            
            if (response.data.success) {
                setIsModalOpen();
            //     setName("");
            //     setDescription("");
            //     const updatedGroups = await axios.get(
            //         `https://dev-api-tenant.gyatagpt.ai/api/v1/virtual_tryon/listgroup?page=${currentPage}`,
            //         { headers }
            //     );
            //     setGroups(updatedGroups.data);
            // } else {
            //     console.error("Failed to create group:", response.data.message);
            }
        } catch (err) {
            console.error(err);
        } 
        // finally {
        //     // setLoading(false);
        // }
    };

    if (!modals || modals.length === 0) {
        return (
            <BlockStack>
                <EmptySearchResult
                    title={"No modals available to display"}
                    description={
                        <>
                            Know more about modals{" "}
                            <Link
                                url="https://media.tenor.com/q2eL6vNVKf4AAAAM/bhai-kya-kar-raha-hai-tu-ashneer-grover.gif"
                                target="_blank"
                            >
                                here
                            </Link>
                        </>
                    }
                    withIllustration
                />
            </BlockStack>
        );
    }

    const resourceName = {
        singular: 'modal',
        plural: 'modals',
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(modals);

    const rows = modals.map((item, index) => (
        <IndexTable.Row
            id={item.id}
            key={item.id}
            selected={selectedResources.includes(item.id)}
            position={index}
        >
            <IndexTable.Cell>
                <Thumbnail
                    source={item.thumbnail_url}
                    alt={item.name}
                    size="small"
                />
            </IndexTable.Cell>
            <IndexTable.Cell>
                <strong>{item.name}</strong>
            </IndexTable.Cell>
            <IndexTable.Cell>{item.group_id}</IndexTable.Cell>
            <IndexTable.Cell>{formatDate(item.created_at)}</IndexTable.Cell>
        </IndexTable.Row>
    ));

    const bulkActions = [
        {
            content: 'Assign',
            onAction: () => handleAssignModals(),
        },
    ];

    return (
        <IndexTable
            resourceName={resourceName}
            itemCount={modals.length}
            selectedItemsCount={
                allResourcesSelected ? 'All' : selectedResources.length
            }
            promotedBulkActions={bulkActions}
            onSelectionChange={handleSelectionChange}
            headings={[
                { title: 'Thumbnail' },
                { title: 'Name' },
                { title: 'Group Id' },
                { title: 'Created Date' },
            ]}
            hasMoreItems
            pagination={{
                hasPrevious: hasPrevious,
                onPrevious: onPrevious,
                label: `${from} - ${to} of ${total}`,
                hasNext: hasNext,
                onNext: onNext,
            }}
        >
            {rows}
        </IndexTable>
    );
}

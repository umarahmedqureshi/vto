import { DataTable } from "@shopify/polaris";
import React from "react";
import formatDate from "../utils/formatDate";
export function GroupTable({ groups, showDetailsGroup, hasNext, onNext, hasPrevious, onPrevious, from, to, total }) {
    console.log("Group Table :: ", groups)

    // Function to open the details for a specific group
    const openDetailGroup = (id) => {
        showDetailsGroup(id);
    };

    // Wrap each row in a clickable wrapper
    const rows = groups.map((item) => [
        // <div
        //     style={{ cursor: "pointer" }}
        //     onClick={() => openDetailGroup(item.id)}
        // >
        //     {item.id}
        // </div>,
        <div
            style={{ cursor: "pointer" }}
            onClick={() => openDetailGroup(item.id)}
        >
            {item.name}
        </div>,
        <div
            style={{ cursor: "pointer" }}
            onClick={() => openDetailGroup(item.id)}
        >
            {formatDate(item.created_at)}
        </div>,
        <div
            style={{ cursor: "pointer" }}
            onClick={() => openDetailGroup(item.id)}
        >
            {item.description}
        </div>,
        <div
            style={{ cursor: "pointer" }}
            onClick={() => openDetailGroup(item.id)}
        >
            {item.model_ids ? item.model_ids : "---"}
        </div>,
    ]);

    return (
        <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={[
                "Name",
                "Created date",
                "Description",
                "Model Ids",
            ]}
            rows={rows}
            pagination={{
                hasNext: hasNext,
                onNext: onNext,
                hasPrevious: hasPrevious,
                onPrevious: onPrevious,
                label: `${from} - ${to} of ${total}`,
            }}

            verticalAlign="middle"
        />
    );
}

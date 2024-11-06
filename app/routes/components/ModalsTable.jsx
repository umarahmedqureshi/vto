import {
    DataTable,
    Link,
    BlockStack,
    EmptySearchResult,
    Thumbnail,
} from "@shopify/polaris";
import React from "react";
import formatDate from '../utils/formatDate';
import "../assets/style.css";

export function ModalsTable({ modals, hasNext, hasPrevious, onNext, onPrevious, from, to, total }) {
    console.log("ModalsTable modals ",modals);
    if (!modals || modals.length === 0) {
        return (
            <BlockStack >
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
    const rows = modals.map((item) => [
        <Thumbnail
            source={item.thumbnail_url}
            alt={item.name}
            size="small"
        />,
        item.name,
        item.group_id,
        formatDate(item.created_at),
    ]);
    return (
        <DataTable
            columnContentTypes={["text", "text", "text", "numeric",]}
            headings={[
                "Modals",
                "Name",
                "Group Id",
                "Created Date",
            ]}
            rows={rows}
            pagination={{
                hasPrevious: hasPrevious,
                onPrevious: onPrevious,
                label : `${from} - ${to} of ${total}`,
                hasNext: hasNext,
                onNext: onNext,
            }}
            verticalAlign="middle"
        />
    );
}

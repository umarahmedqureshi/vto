import React from "react";
import { useState, useCallback } from "react";
import {
    TextField,
    IndexTable,
    Card,
    IndexFilters,
    useSetIndexFiltersMode,
    useIndexResourceState,
    Text,
    ChoiceList,
    RangeSlider,
    useBreakpoints,
} from "@shopify/polaris";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";

export function GroupIndexTable({ groups, showDetailsGroup }) {
    const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));
    const [itemStrings, setItemStrings] = useState([
        "All",
        "Default",
        "Custom",
    ]);
    const deleteView = (index: number) => {
        const newItemStrings = [...itemStrings];
        newItemStrings.splice(index, 1);
        setItemStrings(newItemStrings);
        setSelected(0);
    };

    const duplicateView = async (name: string) => {
        setItemStrings([...itemStrings, name]);
        setSelected(itemStrings.length);
        await sleep(1);
        return true;
    };

    const tabs: TabProps[] = itemStrings.map((item, index) => ({
        content: item,
        index,
        onAction: () => {},
        id: `${item}-${index}`,
        isLocked: index === 0,
        actions:
            index === 0
                ? []
                : [
                      {
                          type: "rename",
                          onAction: () => {},
                          onPrimaryAction: async (
                              value: string,
                          ): Promise<boolean> => {
                              const newItemsStrings = tabs.map((item, idx) => {
                                  if (idx === index) {
                                      return value;
                                  }
                                  return item.content;
                              });
                              await sleep(1);
                              setItemStrings(newItemsStrings);
                              return true;
                          },
                      },
                      {
                          type: "duplicate",
                          onPrimaryAction: async (
                              value: string,
                          ): Promise<boolean> => {
                              await sleep(1);
                              duplicateView(value);
                              return true;
                          },
                      },
                      {
                          type: "edit",
                      },
                      {
                          type: "delete",
                          onPrimaryAction: async () => {
                              await sleep(1);
                              deleteView(index);
                              return true;
                          },
                      },
                  ],
    }));
    const [selected, setSelected] = useState(0);
    const onCreateNewView = async (value: string) => {
        await sleep(500);
        setItemStrings([...itemStrings, value]);
        setSelected(itemStrings.length);
        return true;
    };
    const sortOptions: IndexFiltersProps["sortOptions"] = [
        { label: "Group", value: "group asc", directionLabel: "Ascending" },
        { label: "Group", value: "group desc", directionLabel: "Descending" },
        { label: "Name", value: "name asc", directionLabel: "A-Z" },
        { label: "Name", value: "name desc", directionLabel: "Z-A" },
        { label: "Date", value: "date asc", directionLabel: "A-Z" },
        { label: "Date", value: "date desc", directionLabel: "Z-A" },
    ];
    const [sortSelected, setSortSelected] = useState(["order asc"]);
    const { mode, setMode } = useSetIndexFiltersMode();
    const onHandleCancel = () => {};

    const onHandleSave = async () => {
        await sleep(1);
        return true;
    };

    const primaryAction: IndexFiltersProps["primaryAction"] =
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
    const [accountStatus, setAccountStatus] = useState<string[] | undefined>(
        undefined,
    );
    const [moneySpent, setMoneySpent] = useState<[number, number] | undefined>(
        undefined,
    );
    const [taggedWith, setTaggedWith] = useState("");
    const [queryValue, setQueryValue] = useState("");

    const handleAccountStatusChange = useCallback(
        (value: string[]) => setAccountStatus(value),
        [],
    );
    const handleMoneySpentChange = useCallback(
        (value: [number, number]) => setMoneySpent(value),
        [],
    );
    const handleTaggedWithChange = useCallback(
        (value: string) => setTaggedWith(value),
        [],
    );
    const handleFiltersQueryChange = useCallback(
        (value: string) => setQueryValue(value),
        [],
    );
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

    const filters = [
        {
            key: "accountStatus",
            label: "Account status",
            filter: (
                <ChoiceList
                    title="Account status"
                    titleHidden
                    choices={[
                        { label: "Enabled", value: "enabled" },
                        { label: "Not invited", value: "not invited" },
                        { label: "Invited", value: "invited" },
                        { label: "Declined", value: "declined" },
                    ]}
                    selected={accountStatus || []}
                    onChange={handleAccountStatusChange}
                    allowMultiple
                />
            ),
            shortcut: true,
        },
        {
            key: "taggedWith",
            label: "Tagged with",
            filter: (
                <TextField
                    label="Tagged with"
                    value={taggedWith}
                    onChange={handleTaggedWithChange}
                    autoComplete="off"
                    labelHidden
                />
            ),
            shortcut: true,
        },
        {
            key: "moneySpent",
            label: "Money spent",
            filter: (
                <RangeSlider
                    label="Money spent is between"
                    labelHidden
                    value={moneySpent || [0, 500]}
                    prefix="$"
                    output
                    min={0}
                    max={2000}
                    step={1}
                    onChange={handleMoneySpentChange}
                />
            ),
        },
    ];

    const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
    if (accountStatus && !isEmpty(accountStatus)) {
        const key = "accountStatus";
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, accountStatus),
            onRemove: handleAccountStatusRemove,
        });
    }
    if (moneySpent) {
        const key = "moneySpent";
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, moneySpent),
            onRemove: handleMoneySpentRemove,
        });
    }
    if (!isEmpty(taggedWith)) {
        const key = "taggedWith";
        appliedFilters.push({
            key,
            label: disambiguateLabel(key, taggedWith),
            onRemove: handleTaggedWithRemove,
        });
    }

    const resourceName = {
        singular: "group",
        plural: "groups",
    };
    const openDetailGroup = (id: string) => {
        showDetailsGroup(id);
    };

    const { selectedResources, allResourcesSelected, handleSelectionChange } =
        useIndexResourceState(groups);
    // console.log("Selected Groups", selectedResources);

    const rowMarkup = groups.map(
        (
            { id, name, created_date, models_count, products_count }: any,
            index: number,
        ) => (
            <IndexTable.Row
                id={id}
                key={id}
                selected={selectedResources.includes(id)}
                position={index}
                onClick={() => {
                    openDetailGroup(id);
                }}
            >
                <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                        {id}
                    </Text>
                </IndexTable.Cell>
                <IndexTable.Cell>{created_date}</IndexTable.Cell>
                <IndexTable.Cell>{name}</IndexTable.Cell>
                {/* <IndexTable.Cell>
                    <Text as="span" alignment="end" numeric>
                        {status}
                    </Text>
                </IndexTable.Cell> */}
                <IndexTable.Cell>{models_count}</IndexTable.Cell>
                <IndexTable.Cell>{products_count}</IndexTable.Cell>
            </IndexTable.Row>
        ),
    );

    return (
        <Card>
            <IndexFilters
                sortOptions={sortOptions}
                sortSelected={sortSelected}
                queryValue={queryValue}
                queryPlaceholder="Searching in all"
                onQueryChange={handleFiltersQueryChange}
                onQueryClear={() => setQueryValue("")}
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
            <IndexTable
                condensed={useBreakpoints().smDown}
                resourceName={resourceName}
                itemCount={groups.length}
                selectedItemsCount={
                    allResourcesSelected ? "All" : selectedResources.length
                }
                onSelectionChange={handleSelectionChange}
                headings={[
                    { title: "Group Id" },
                    { title: "Created date" },
                    { title: "Group name" },
                    { title: "Models" },
                    { title: "products" },
                ]}
            >
                {rowMarkup}
            </IndexTable>
        </Card>
    );

    function disambiguateLabel(key: string, value: string | any[]): string {
        switch (key) {
            case "moneySpent":
                return `Money spent is between $${value[0]} and $${value[1]}`;
            case "taggedWith":
                return `Tagged with ${value}`;
            case "accountStatus":
                return (value as string[])
                    .map((val) => `Customer ${val}`)
                    .join(", ");
            default:
                return value as string;
        }
    }

    function isEmpty(value: string | string[]): boolean {
        if (Array.isArray(value)) {
            return value.length === 0;
        } else {
            return value === "" || value == null;
        }
    }
}

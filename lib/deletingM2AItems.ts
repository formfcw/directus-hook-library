import { createError } from "@directus/errors";
import type { HookExtensionContext } from "@directus/extensions";
import type { EventContext, PrimaryKey } from "@directus/types";
import type { RegisterFunctions } from "./types";

type JunctionCollection = {
    name: string;
    foreignKey: string;
    foreignCollection: string;
};

type AnyCollection = {
    name: string;
    key: string;
};

type ContextPreventDeletion = {
    /** collections which items should not be deleted, if they are related to a junctionCollection */
    relatedCollections: string[];
    /** collections to search in */
    junctionCollections: JunctionCollection[];
};

type ContextReallyDeleteUnused = {
    /** collections to search in */
    junctionCollections: JunctionCollection[];
    /** collections that potentially have unused items */
    anyCollections: AnyCollection[];
};

/** maps the array elements to objects of type JunctionCollection with a default `foreignKey` field of `“item”` and a default `foreignCollection` field of `“collection”`  */
export const toJunctionCollectionM2A = (name: string): JunctionCollection => ({
    name,
    foreignKey: "item",
    foreignCollection: "collection",
});

/** maps the array elements to objects of type AnyCollection with a default `key` field of `“id”`  */
export const toAnyCollectionM2A = (name: string): AnyCollection => ({
    name,
    key: "id",
});

/**
 * Go through all `junctionCollections` and search for the `relatedCollection` items to delete. If found, prevent deletion.
 *
 * Used for M2A items to prevent their deletion, which is not possible via directus itself.
 *
 * Find M2A items by searching the schema for `“one_allowed_collections”` and look for collections that are deletable/reachable by the app/user (`many_collection` goes to the `junctionCollections`)
 */
export const preventDeletingM2AItems = (
    { filter }: RegisterFunctions,
    { services, getSchema }: HookExtensionContext,
    { relatedCollections, junctionCollections }: ContextPreventDeletion
) => {
    const { ItemsService } = services;

    for (const collection of relatedCollections) {
        filter(`${collection}.items.delete`, handler);
    }

    async function handler(
        itemsToDelete: any,
        meta: Record<string, any>,
        context: EventContext
    ) {
        for (const itemToDelete of itemsToDelete) {
            for (const junctionCollection of junctionCollections) {
                const itemsService = new ItemsService(junctionCollection.name, {
                    ...context,
                    schema: await getSchema(),
                });

                const relatedItems = await itemsService.readByQuery({
                    limit: -1,
                    filter: {
                        _and: [
                            {
                                [junctionCollection.foreignKey]: {
                                    _eq: itemToDelete,
                                },
                            },
                            {
                                [junctionCollection.foreignCollection!]: {
                                    _eq: meta.collection,
                                },
                            },
                        ],
                    },
                    fields: [],
                });

                if (relatedItems?.length) {
                    const InvalidDeletionException = createError(
                        "InvalidDeletionException",
                        `This item is related to “${junctionCollection.name}” and therefore cannot be deleted!`
                    );
                    throw new InvalidDeletionException();
                }
            }
        }

        return itemsToDelete;
    }
};

/**
 * Go through all `junctionCollections` and store the keys for each found `anyCollection` item. Then delete all `anyCollections` items that are not included in the stored keys.
 *
 * Used to delete related M2A items that should not be kept, which is not possible via directus itself.
 */
export const deleteUnusedM2AItems = (
    { action }: RegisterFunctions,
    { services, getSchema }: HookExtensionContext,
    { anyCollections, junctionCollections }: ContextReallyDeleteUnused
) => {
    const { ItemsService } = services;

    action("items.delete", handler);

    async function handler(meta: Record<string, any>, context: EventContext) {
        for (const anyCollection of anyCollections) {
            const usedAnyCollectionItems = await _getUsedAnyCollectionItems(
                anyCollection
            );

            const anyItemsService = new ItemsService(anyCollection.name, {
                ...context,
                schema: await getSchema(),
            });

            await anyItemsService.deleteByQuery({
                limit: -1,
                filter: {
                    [anyCollection.key]: {
                        _nin: usedAnyCollectionItems,
                    },
                },
            });
        }

        async function _getUsedAnyCollectionItems(
            anyCollection: AnyCollection
        ) {
            const usedItems: PrimaryKey[] = [];

            for (const junctionCollection of junctionCollections) {
                const junctionItemsService = new ItemsService(
                    junctionCollection.name,
                    {
                        ...context,
                        schema: await getSchema(),
                    }
                );

                const anyCollectionItems =
                    await junctionItemsService.readByQuery({
                        limit: -1,
                        filter: {
                            [junctionCollection.foreignCollection!]: {
                                _eq: anyCollection.name,
                            },
                        },
                        fields: [junctionCollection.foreignKey],
                    });

                anyCollectionItems.forEach((item: any) => {
                    const id = item[junctionCollection.foreignKey];
                    if (!id) return;

                    usedItems.push(id);
                });
            }

            return usedItems;
        }
    }
};

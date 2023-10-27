// This deletes all items from a collection `oneCollection`, where all (reverse) related fields `manyField of manyCollections` are null
// This makes sense for a M2O relation that is used like a O2O relation

import type { HookExtensionContext } from "@directus/extensions";
import type { EventContext } from "@directus/types";
import type { RegisterFunctions } from "./types";

type ManyField = string;

type ManyCollection = string;

type O2MContext = {
    /** collection that potentially have unused items */
    oneCollection: string;
    /** collections and their reverse key field, that are related to the `oneCollection` item */
    manyCollections: {
        [key: ManyField]: ManyCollection;
    };
};

/**
 * Delete all `oneCollection` items that loose their relationship to a `manyCollections` item.
 *
 * Used to delete related M2O items that should not be kept, which is not possible via directus itself.
 *
 * _Note_: You have to specify a (hidden) reverse relationship `O2M` in your `oneCollection` inside Directus to make this work.
 */
export default function (
    { action }: RegisterFunctions,
    { services, getSchema }: HookExtensionContext,
    { oneCollection, manyCollections }: O2MContext
) {
    action("items.update", handler);
    action("items.delete", handler);

    async function handler(meta: Record<string, any>, context: EventContext) {
        const _manyCollections = Object.values(manyCollections);
        if (!_manyCollections.includes(meta.collection)) return;

        const _manyFields = Object.keys(manyCollections);

        const { ItemsService } = services;
        const itemsService = new ItemsService(oneCollection, {
            ...context,
            schema: await getSchema(),
        });

        await itemsService.deleteByQuery({
            limit: -1,
            filter: {
                _and: _manyFields.map((field) => ({
                    [field]: { _null: true },
                })),
            },
        });
    }
}

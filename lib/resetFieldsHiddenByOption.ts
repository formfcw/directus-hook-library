import type { RegisterFunctions } from "./types";
import type { HookExtensionContext } from "@directus/extensions";
import type { EventContext } from "@directus/types";

type ResetGroup = {
    not: string[];
    nullify: string[];
};

type ResetContext = {
    collection: string;
    optionsField: string;
    resetGroups: ResetGroup[];
};

export default function (
    { filter }: RegisterFunctions,
    { services, getSchema }: HookExtensionContext,
    { collection, optionsField, resetGroups }: ResetContext
) {
    const { ItemsService } = services;

    filter(`${collection}.items.create`, handler);
    filter(`${collection}.items.update`, handler);

    async function handler(
        input: any,
        meta: Record<string, any>,
        context: EventContext
    ) {
        if (input.hasOwnProperty(optionsField)) {
            _resetBySelectedOption(input[optionsField]);
            return input;
        }

        if (!meta.keys) return input;

        const itemsService = new ItemsService(meta.collection, {
            ...context,
            schema: await getSchema(),
        });

        for (const key of meta.keys) {
            const item = await itemsService.readOne(key, {
                fields: [optionsField],
            });

            if (item?.[optionsField]) {
                _resetBySelectedOption(item[optionsField]);
            }
        }

        return input;

        function _resetBySelectedOption(selectedOption: string) {
            resetGroups.forEach((resetGroup) => {
                if (!resetGroup.not.includes(selectedOption)) {
                    resetGroup.nullify.forEach(
                        (field) => (input[field] = null)
                    );
                }
            });
        }
    }
}

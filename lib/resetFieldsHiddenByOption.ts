import type { RegisterFunctions } from "./types";
import type { HookExtensionContext } from "@directus/extensions";

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
    context: HookExtensionContext,
    { collection, optionsField, resetGroups }: ResetContext
) {
    filter(`${collection}.items.create`, handler);
    filter(`${collection}.items.update`, handler);

    async function handler(input: any) {
        if (input.hasOwnProperty(optionsField)) {
            _resetBySelectedOption(input[optionsField]);
            return input;
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

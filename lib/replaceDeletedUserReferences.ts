// This replaces the reference to a deleted user with a reference to the current user.

import type { HookExtensionContext } from "@directus/extensions";
import type { RegisterFunctions } from "./types";

export default function (
    { filter }: RegisterFunctions,
    { services, getSchema }: HookExtensionContext
) {
    const { FilesService } = services;

    filter("users.delete", async (input, meta, context) => {
        const usersToDelete = input;
        const {
            accountability: { user },
        } = context as any;
        const filesService = new FilesService({
            ...context,
            schema: await getSchema(),
        });

        await filesService.updateByQuery(
            {
                limit: -1,
                filter: { uploaded_by: { _in: usersToDelete } },
            },
            { uploaded_by: user }
        );
        await filesService.updateByQuery(
            {
                limit: -1,
                filter: { modified_by: { _in: usersToDelete } },
            },
            { modified_by: user }
        );

        return input;
    });
}

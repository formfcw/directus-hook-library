// This overwrites the values for `settings` in the Project Settings when starting Directus

import type { HookExtensionContext } from "@directus/extensions";
import type { RegisterFunctions } from "./types";

export default function (
    { action }: RegisterFunctions,
    { services, getSchema }: HookExtensionContext,
    settings: string[]
) {
    const { SettingsService } = services;
    const upsert: Record<string, string> = {};

    settings.forEach((prop) => {
        const envProp = prop.toUpperCase();
        if (process.env[envProp]) upsert[prop] = process.env[envProp] as string;
    });

    action("server.start", async (_server, context) => {
        const settingsService = new SettingsService({
            ...context,
            schema: await getSchema(),
        });
        await settingsService.upsertSingleton(upsert);
    });
}

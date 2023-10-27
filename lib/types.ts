import type {
    FilterHandler,
    ActionHandler,
    InitHandler,
    ScheduleHandler,
    EmbedHandler,
} from "@directus/types";

// Copied from @directus/types/hooks.d.ts
export type RegisterFunctions = {
    filter: (event: string, handler: FilterHandler) => void;
    action: (event: string, handler: ActionHandler) => void;
    init: (event: string, handler: InitHandler) => void;
    schedule: (cron: string, handler: ScheduleHandler) => void;
    embed: (position: "head" | "body", code: string | EmbedHandler) => void;
};

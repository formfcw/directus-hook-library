# Directus Hook Library

[![NPM version](https://img.shields.io/npm/v/directus-hook-library)](https://www.npmjs.com/package/directus-hook-library)

A collection of customizable hooks for Directus. This is not an extension, but a library of scripts that could be used inside a Directus hook extension.

## Installation & Usage

First [create a Directus Extension](https://docs.directus.io/extensions/creating-extensions.html) and during setup choose the extension type `hook`.

Inside the extension folder install `directus-hook-library`:

```sh
npm install directus-hook-library
```

Import it in `src/index.ts`, like:

```js
import { setProjectSettingsFromEnvVars } from "directus-hook-library";
```

Have a look at the examples below.

> _Tip:_ You can use multiple of these hook scripts inside the same Directus hook.

## Hooks & Examples

### `deleteUnusedM2OItems`

Used to delete related M2O items that loose their relation and should not be kept, which is not possible via directus itself. This makes sense for a M2O relation that is used like a O2O relation.

Delete all `oneCollection` items that loose their relationship to a `manyCollections` item.

**(!) Important**: You have to specify a (hidden) reverse relationship `O2M` in your `oneCollection` inside Directus to make this work.

<details><summary>Example</summary>

```ts
// src/index.ts
import { defineHook } from "@directus/extensions-sdk";
import { deleteUnusedM2OItems } from "directus-hook-library";

export default defineHook((register, context) => {
    deleteUnusedM2OItems(register, context, {
        oneCollection: "meta_infos",
        manyCollections: {
            pages: "pages",
            posts: "posts",
        },
    });
});
```

</details>

### `deleteUnusedM2AItems`

Used to delete related M2A items that loose their relation and should not be kept, which is not possible via directus itself.

Goes through all `junctionCollections` and stores the keys for each found `anyCollection` item. Then deletes all `anyCollections` items that are not included in the stored keys.

<details><summary>Example</summary>

```ts
// src/index.ts
import { defineHook } from "@directus/extensions-sdk";
import {
    toJunctionCollectionM2A,
    toAnyCollectionM2A,
    deleteUnusedM2AItems,
} from "directus-hook-library";

export default defineHook((register, context) => {
    deleteUnusedM2AItems(register, context, {
        anyCollections: [
            "gallery",
            "video",
            "definition_list",
            "related_content",
        ].map(toAnyCollectionM2A),
        junctionCollections: ["page_editor_nodes", "post_editor_nodes"].map(
            toJunctionCollectionM2A
        ),
    });
});
```

**`toAnyCollectionM2A`** ... maps the array elements to objects of type `AnyCollection` with a default `key` field of `“id”`.

**`toJunctionCollectionM2A`** ... maps the array elements to objects of type `JunctionCollection` with a default `foreignKey` field of `“item”` and a default `foreignCollection` field of `“collection”`

</details>

### `preventDeletingM2AItems`

Used for M2A items to prevent their deletion, which is not possible via directus itself.

Goes through all `junctionCollections` and searches for the `relatedCollection` items to delete. If found, prevents deletion.

> Find M2A items by searching the schema for `“one_allowed_collections”` and look for collections that are deletable/reachable by the app/user (`many_collection` goes to the `junctionCollections`)

<details><summary>Example</summary>

```ts
// src/index.ts
import { defineHook } from "@directus/extensions-sdk";
import {
    toJunctionCollectionM2A,
    preventDeletingM2AItems,
} from "directus-hook-library";

export default defineHook((register, context) => {
    preventDeletingM2AItems(register, context, {
        relatedCollections: ["video"],
        junctionCollections: ["page_editor_nodes", "post_editor_nodes"].map(
            toJunctionCollectionM2A
        ),
    });
});
```

**`toJunctionCollectionM2A`** ... maps the array elements to objects of type `JunctionCollection` with a default `foreignKey` field of `“item”` and a default `foreignCollection` field of `“collection”`

</details>

### `replaceDeletedUserReferences`

This replaces the reference to a deleted user with a reference to the current user in the directus_files collection.

<details><summary>Example</summary>

```ts
// src/index.ts
import { defineHook } from "@directus/extensions-sdk";
import { replaceDeletedUserReferences } from "directus-hook-library";

export default defineHook((register, context) => {
    replaceDeletedUserReferences(register, context);
});
```

</details>

### `resetFieldsHiddenByOption`

Set fields to null that have a value but are hidden by a condition.

<details><summary>Example</summary>

```ts
// src/index.ts
import { defineHook } from "@directus/extensions-sdk";
import { resetFieldsHiddenByOption } from "directus-hook-library";

export default defineHook((register, context) => {
    resetFieldsHiddenByOption(register, context, {
        collection: "conditional",
        optionsField: "detail",
        resetGroups: [
            {
                not: ["yes"],
                nullify: ["title", "description"],
            },
            {
                not: ["no"],
                nullify: ["external_link"],
            },
        ],
    });
});
```

</details>

### `setProjectSettingsFromEnvVars`

Used for setting project settings from ENV vars like, `PROJECT_URL`.

This overwrites the values for `settings` in the Project Settings when starting Directus.

<details><summary>Example</summary>

```ts
// src/index.ts
import { defineHook } from "@directus/extensions-sdk";
import { setProjectSettingsFromEnvVars } from "directus-hook-library";

export default defineHook((register, context) => {
    setProjectSettingsFromEnvVars(register, context, [
        "project_name",
        "project_descriptor",
        "project_url",
    ]);
});
```

For ENV variables like:

```.env
PROJECT_NAME=Directus
PROJECT_DESCRIPTOR=Hook
PROJECT_URL=http://localhost:3000
```

</details>

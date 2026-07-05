// Hand-written OpenAPI 3.0 spec describing the whole API.
// Served as an interactive page by swagger-ui-express at /api/docs.
// Keep this in sync when you add or change a route.

export const openApiSpec = {
    openapi: "3.0.3",
    info: {
        title: "YouTube Clone API",
        version: "1.0.0",
        description:
            "REST API for a YouTube-style video platform. Auth is JWT (Bearer). " +
            "Click **Authorize** and paste a token from /api/signin to try protected routes.",
    },
    // Relative URL so "Try it out" targets whatever host serves the docs
    // (localhost in dev, the deployed origin in production).
    servers: [
        { url: "/", description: "This server" },
    ],
    tags: [
        { name: "Auth", description: "Signup & signin" },
        { name: "Videos", description: "Video listing, detail, upload, views" },
        { name: "Comments", description: "Comment threads on videos" },
        { name: "Likes", description: "Like / dislike reactions" },
        { name: "Subscriptions", description: "Channel subscriptions & feed" },
        { name: "Channels", description: "Channel profile pages" },
        { name: "System", description: "Health check" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            AuthResponse: {
                type: "object",
                properties: {
                    token: { type: "string" },
                    userId: { type: "string", format: "uuid" },
                },
            },
            Channel: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    channelName: { type: "string", nullable: true },
                    profilePicture: { type: "string", nullable: true },
                    subscriberCount: { type: "integer" },
                },
            },
            Video: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    title: { type: "string" },
                    description: { type: "string", nullable: true },
                    videoUrl: { type: "string" },
                    thumbnail: { type: "string" },
                    views: { type: "integer" },
                    userId: { type: "string", format: "uuid" },
                    createdAt: { type: "string", format: "date-time" },
                    user: { $ref: "#/components/schemas/Channel" },
                },
            },
            Comment: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    text: { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                    user: { $ref: "#/components/schemas/Channel" },
                },
            },
            Error: {
                type: "object",
                properties: { message: { type: "string" } },
            },
        },
    },
    paths: {
        "/health": {
            get: {
                tags: ["System"],
                summary: "Liveness check",
                responses: {
                    "200": {
                        description: "Service is up",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: { status: { type: "string", example: "ok" } },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/signup": {
            post: {
                tags: ["Auth"],
                summary: "Create an account",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password", "gender", "channelName"],
                                properties: {
                                    username: { type: "string", minLength: 3 },
                                    password: { type: "string", minLength: 6 },
                                    gender: { type: "string", enum: ["Male", "Female", "Other"] },
                                    channelName: { type: "string", minLength: 1 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": {
                        description: "Account created; returns a JWT",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
                    },
                    "400": { description: "Validation error or user exists", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                },
            },
        },
        "/api/signin": {
            post: {
                tags: ["Auth"],
                summary: "Log in",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["username", "password"],
                                properties: {
                                    username: { type: "string" },
                                    password: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Logged in; returns a JWT",
                        content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } },
                    },
                    "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
                },
            },
        },
        "/api/videos": {
            get: {
                tags: ["Videos"],
                summary: "List videos (search + cursor pagination)",
                parameters: [
                    { name: "search", in: "query", schema: { type: "string" }, description: "Case-insensitive title match" },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
                    { name: "cursor", in: "query", schema: { type: "string" }, description: "id of the last item from the previous page" },
                ],
                responses: {
                    "200": {
                        description: "Page of videos",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        videos: { type: "array", items: { $ref: "#/components/schemas/Video" } },
                                        nextCursor: { type: "string", nullable: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Videos"],
                summary: "Create a video record (after uploading files to R2)",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["title", "videoUrl", "thumbnail"],
                                properties: {
                                    title: { type: "string", minLength: 1 },
                                    description: { type: "string" },
                                    videoUrl: { type: "string", format: "uri" },
                                    thumbnail: { type: "string", format: "uri" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Video" } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/videos/{id}": {
            get: {
                tags: ["Videos"],
                summary: "Get a single video with like counts",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": { description: "Video with likes/dislikes", content: { "application/json": { schema: { $ref: "#/components/schemas/Video" } } } },
                    "404": { description: "Not found" },
                },
            },
        },
        "/api/videos/{id}/view": {
            post: {
                tags: ["Videos"],
                summary: "Record a view (and watch history if authed)",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "View recorded" } },
            },
        },
        "/api/upload-url": {
            post: {
                tags: ["Videos"],
                summary: "Get a presigned R2 upload URL",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["fileName", "contentType", "kind"],
                                properties: {
                                    fileName: { type: "string" },
                                    contentType: { type: "string", example: "video/mp4" },
                                    kind: { type: "string", enum: ["video", "thumbnail"] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Presigned PUT URL + the eventual public URL",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        uploadUrl: { type: "string" },
                                        publicUrl: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/videos/{id}/comments": {
            get: {
                tags: ["Comments"],
                summary: "List comments (newest first, cursor pagination)",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
                    { name: "cursor", in: "query", schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "Page of comments",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } },
                                        nextCursor: { type: "string", nullable: true },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                tags: ["Comments"],
                summary: "Add a comment",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["text"],
                                properties: { text: { type: "string", minLength: 1, maxLength: 1000 } },
                            },
                        },
                    },
                },
                responses: {
                    "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/Comment" } } } },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Video not found" },
                },
            },
        },
        "/api/comments/{id}": {
            delete: {
                tags: ["Comments"],
                summary: "Delete your own comment",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "204": { description: "Deleted" },
                    "401": { description: "Unauthorized" },
                    "403": { description: "Not your comment" },
                    "404": { description: "Not found" },
                },
            },
        },
        "/api/videos/{id}/like": {
            post: {
                tags: ["Likes"],
                summary: "Toggle like/dislike",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["type"],
                                properties: { type: { type: "string", enum: ["LIKE", "DISLIKE"] } },
                            },
                        },
                    },
                },
                responses: {
                    "200": {
                        description: "Fresh counts + your current reaction",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        likes: { type: "integer" },
                                        dislikes: { type: "integer" },
                                        userReaction: { type: "string", nullable: true, enum: ["LIKE", "DISLIKE", null] },
                                    },
                                },
                            },
                        },
                    },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/channels/{id}/subscribe": {
            post: {
                tags: ["Subscriptions"],
                summary: "Toggle subscription to a channel",
                security: [{ bearerAuth: [] }],
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    "200": {
                        description: "New subscription state + count",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        subscribed: { type: "boolean" },
                                        subscriberCount: { type: "integer" },
                                    },
                                },
                            },
                        },
                    },
                    "400": { description: "Cannot subscribe to yourself" },
                    "401": { description: "Unauthorized" },
                    "404": { description: "Channel not found" },
                },
            },
        },
        "/api/me/subscriptions": {
            get: {
                tags: ["Subscriptions"],
                summary: "Recent videos from channels you subscribe to",
                security: [{ bearerAuth: [] }],
                responses: {
                    "200": { description: "Feed", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Video" } } } } },
                    "401": { description: "Unauthorized" },
                },
            },
        },
        "/api/channels/{id}": {
            get: {
                tags: ["Channels"],
                summary: "Channel profile + its videos",
                parameters: [
                    { name: "id", in: "path", required: true, schema: { type: "string" } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
                    { name: "cursor", in: "query", schema: { type: "string" } },
                ],
                responses: {
                    "200": {
                        description: "Channel with a page of its videos",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        channel: { $ref: "#/components/schemas/Channel" },
                                        videos: { type: "array", items: { $ref: "#/components/schemas/Video" } },
                                        nextCursor: { type: "string", nullable: true },
                                        isSubscribed: { type: "boolean" },
                                        isOwner: { type: "boolean" },
                                    },
                                },
                            },
                        },
                    },
                    "404": { description: "Channel not found" },
                },
            },
        },
    },
} as const;

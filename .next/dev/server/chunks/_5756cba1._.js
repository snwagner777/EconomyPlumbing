module.exports = [
"[project]/shared/schema.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/shared/schema.ts [app-route] (ecmascript)");
    });
});
}),
"[project]/server/db.ts [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.resolve().then(() => {
        return parentImport("[project]/server/db.ts [app-route] (ecmascript)");
    });
});
}),
"[project]/node_modules/drizzle-orm/index.js [app-route] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/node_modules_drizzle-orm_62548a5b._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[project]/node_modules/drizzle-orm/index.js [app-route] (ecmascript)");
    });
});
}),
];
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-unresolved",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-undeclared",
      severity: "error",
      from: {},
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
    {
      name: "no-production-dev-dependencies",
      severity: "error",
      from: { path: "^src/" },
      to: { dependencyTypes: ["npm-dev"] },
    },
    {
      name: "domain-is-independent",
      severity: "error",
      from: { path: "^src/features/([^/]+)/domain/" },
      to: { pathNot: "^src/features/$1/domain/" },
    },
    {
      name: "application-depends-on-domain-only",
      severity: "error",
      from: { path: "^src/features/([^/]+)/application/" },
      to: { pathNot: "^src/features/$1/domain/" },
    },
    {
      name: "infrastructure-boundary",
      severity: "error",
      from: { path: "^src/features/([^/]+)/infrastructure/" },
      to: {
        path: "^src/",
        pathNot:
          "^src/(features/$1/(domain|application|infrastructure)/|shared/infrastructure/)",
      },
    },
    {
      name: "presentation-receives-implementations",
      severity: "error",
      from: { path: "^src/features/([^/]+)/presentation/" },
      to: {
        path: "^src/",
        pathNot:
          "^src/(features/$1/(domain|application|presentation)/|shared/presentation/)",
      },
    },
    {
      name: "presentation-no-transport-clients",
      severity: "error",
      from: { path: "^src/features/[^/]+/presentation/" },
      to: { path: "node_modules/(axios|next)(/|$)" },
    },
    {
      name: "shared-does-not-know-features",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/", pathNot: "^src/shared/" },
    },
    {
      name: "app-uses-feature-composition",
      severity: "error",
      from: { path: "^src/app/" },
      to: {
        path: "^src/features/",
        pathNot: "^src/features/[^/]+/composition\\.(client|server)\\.tsx?$",
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
  },
};

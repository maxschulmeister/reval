/**
 * Creates the drizzle.config.ts content for database configuration
 * @returns The drizzle config file content as a string
 */
export const createDrizzleConfig = (): string => {
  return `import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './node_modules/@reval/core/src/db/schema.ts',
  out: './.reval',
  dbCredentials: {
    url: './.reval/reval.db',
  },
});
`;
};
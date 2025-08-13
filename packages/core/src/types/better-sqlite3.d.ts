declare module "better-sqlite3" {
  interface Database {
    loadExtension(path: string): void;
  }
}
import level from "level";

export const vaultStorePath = "./db/.vault-store";
export const db = level(vaultStorePath);

export default db;

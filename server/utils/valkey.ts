import Valkey from "iovalkey";

const { VALKEY_URL } = process.env;
export const valkey = new Valkey(VALKEY_URL!);

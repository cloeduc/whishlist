// Separate process for tests: opens the database of `argv[2]` (same path as WISHLIST_DATA_PATH)
// and prints the number of accounts and import markers.
import { openStore } from "../../../src/store/connection";

const store = openStore(process.argv[2]);
const users = (store.reader.prepare("select count(*) as n from users").get() as { n: number }).n;
const markers = (store.reader.prepare("select count(*) as n from meta where key = 'legacy_import'").get() as { n: number }).n;
process.stdout.write(JSON.stringify({ users, markers }));

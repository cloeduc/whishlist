// Unique suffix for the accounts, lists and ideas created by a flow (R6): timestamp + random, lowercase.
output.unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

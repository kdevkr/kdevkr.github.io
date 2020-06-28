---
  date: 2021-06-28
  title: View
---

```pgsql
CREATE OR REPLACE VIEW vw_account AS
SELECT account.*, authorities.authority, authorities.scope
FROM account
  INNER JOIN account_authorities authorities
WITH READ ONLY;

DROP VIEW vw_account CASCADE;
```

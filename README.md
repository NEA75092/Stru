# Structura

Cockpit CGP pour le pilotage de produits structurés.

- **App :** [`structura-v2/`](./structura-v2/)
- **Live :** [zesty-tiramisu-e45883.netlify.app](https://zesty-tiramisu-e45883.netlify.app/)
- **GitHub :** [NEA75092/Stru](https://github.com/NEA75092/Stru)

## Local

```bash
cd structura-v2
npm install
npm run dev
```

→ http://localhost:3000

## Netlify (réglages actuels)

| Setting | Valeur |
|--------|--------|
| Repository | `github.com/NEA75092/Stru` |
| Production branch | `master` |
| Package directory | `structura-v2/` |
| Publish directory | `structura-v2/` (ou `.` si lu depuis le package dir) |
| Build command | vide / echo (site statique) |
| Functions | non utilisées |

Config fichier : `structura-v2/netlify.toml`

Après un `git push origin master`, un deploy automatique doit partir.

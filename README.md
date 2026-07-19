# Structura

Cockpit CGP pour le pilotage de produits structurés.

- **Code applicatif :** [`structura-v2/`](./structura-v2/)
- **Site publié :** [zesty-tiramisu-e45883.netlify.app](https://zesty-tiramisu-e45883.netlify.app/)
- **Repo :** [github.com/NEA75092/Stru](https://github.com/NEA75092/Stru)

## Développement local

```bash
cd structura-v2
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

## Déploiement Netlify

Le fichier [`netlify.toml`](./netlify.toml) publie le dossier `structura-v2` (site statique, pas de build).

Chaque `git push` sur `master` déclenche un redeploy si le site est lié à ce dépôt.

## Problème

Sur la capture, le bouton actif « Tous les flux » apparaît en bleu vif avec un texte **bleu-noir foncé** très peu lisible.

C'est dû au token `--primary-foreground` en mode sombre dans `src/index.css` :

```
--primary: 217 91% 60%;            /* bleu vif */
--primary-foreground: 222 47% 11%; /* bleu-noir foncé */
```

Tous les boutons en variant `default` (boutons actifs des filtres « Affichage », « Période », « Articles lus », pagination, badges primaires…) héritent de ce contraste faible.

## Correctif

Dans `src/index.css`, bloc `.dark`, remplacer :

```
--primary-foreground: 222 47% 11%;
```

par :

```
--primary-foreground: 0 0% 100%;
```

Texte blanc pur sur le bleu `217 91% 60%` → contraste WCAG AA OK, et identique à ce qui est déjà fait pour `--sidebar-primary-foreground`.

## Vérification

- Recharger `/` en mode sombre
- Vérifier que « Mes flux », « Tous les flux », « Aujourd'hui », « Afficher les lus », pagination active, etc. affichent un libellé blanc lisible
- Vérifier le mode clair : inchangé (`--primary-foreground` reste `210 40% 98%`)
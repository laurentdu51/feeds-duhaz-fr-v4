## Pourquoi le preview se recharge en boucle

Les logs du dev server montrent une **erreur de compilation Vite/SWC** dans `src/pages/Index.tsx` :

```
Adjacent JSX elements must be wrapped in an enclosing tag.
Did you want a JSX fragment <>...</>?  (348:6)
```

Tant que le fichier ne compile pas, le HMR échoue, le bundle est invalide, et le preview retombe en permanence sur l'écran « Chargement des articles… » (visible dans le replay : `Initializing application` toutes les 2-5 s).

## Cause

Dans le bloc pagination (lignes 309-328), le `.map()` retourne un fragment court `<>...</>`. SWC (via `lovable-tagger` en dev) n'arrive pas à parser ce fragment retourné directement depuis une arrow function entre parenthèses, et signale les éléments JSX comme « adjacents non encapsulés ».

De plus, un fragment `<>` ne peut pas porter de `key`, ce qui provoquerait de toute façon un warning React dans la liste.

## Correction prévue

Remplacer le fragment court par `React.Fragment` avec une `key`, dans `src/pages/Index.tsx` lignes 311-328 :

```tsx
.map((page, index, array) => (
  <React.Fragment key={page}>
    {index > 0 && array[index - 1] !== page - 1 && (
      <PaginationItem>
        <PaginationEllipsis />
      </PaginationItem>
    )}
    <PaginationItem>
      <PaginationLink
        onClick={() => setCurrentPage(page)}
        isActive={currentPage === page}
        className="cursor-pointer"
      >
        {page}
      </PaginationLink>
    </PaginationItem>
  </React.Fragment>
))
```

Et ajouter `import React from 'react'` en haut du fichier (ou utiliser `Fragment` importé nommément).

## Vérification

- Vérifier dans les logs `vite` qu'il n'y a plus d'erreur de parse.
- Charger `/` et confirmer que la page reste affichée sans reload en boucle.

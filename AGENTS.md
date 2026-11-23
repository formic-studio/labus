# Zasady pracy nad Labus

- WordPress i Bricks renderują treść oraz strukturę strony. Pisz interakcje w modułowym TypeScript i utrzymuj je w `src/ts/`. W Bricks używaj semantycznych znaczników, czytelnych klas i atrybutów `data-*`.
- Rejestruj moduły w `src/ts/main.ts` przez `createComponentRegistry`. Preferuj selektory `data-component` dla korzeni i atrybuty `data-*` dla elementów wewnętrznych. Uruchamiaj moduł na podstawie DOM, bez zależności od slugów i adresów stron.
- Używaj ogólnych nazw dla globalnych klas i zmiennych w Bricks, np. `type-display`, `gap-24`, `--space-24` i `--color-lime`. Zachowuj identyfikatory istniejących wpisów przy zmianie nazw.
- Każda definicja musi mieć unikalną nazwę i import dynamiczny. Importuj ciężkie biblioteki wewnątrz modułów, które z nich korzystają. Dodawaj biblioteki tylko z uzasadnieniem. Frontend korzysta z natywnych API przeglądarki.
- Zachowuj progressive enhancement. Treść i nawigacja muszą działać bez JS. Używaj natywnej semantyki, wspieraj klawiaturę i widoczny fokus. Aktualizuj ARIA przy zmianie stanu, jeśli przeglądarka sama go nie udostępnia. Respektuj `prefers-reduced-motion`.
- Zachowuj zgodność z `bricks/ajax/nodes_added`. Komponent ma działać przy wielu instancjach, po doładowaniu AJAX oraz gdy na stronie brakuje jego selektora. Rejestr zapobiega wielokrotnemu montowaniu.
- Listenery globalne muszą mieć cleanup. Korzystaj z `AbortSignal` lub zwracaj funkcję usuwającą listenery i zwalniającą zasoby. Własne obserwatory, timery i instancje bibliotek kończ przy odmontowaniu.
- Zmiany PHP wprowadzaj w `inc/`, stosując WordPress Coding Standards. Korzystaj z udokumentowanych funkcji i hooków. Trzymaj sekrety, tokeny i pliki środowiskowe poza repozytorium.
- Każdy moduł musi przejść `npm run typecheck`, `npm run lint` i `npm run build`. Przed przekazaniem zmian uruchom `npm run check`. Po zmianach zatrzymaj watch, przebuduj i zaktualizuj cały `dist/` wraz z usunięciami. Commit obejmuje źródła i artefakty.
- Użytkownik udzielił stałej zgody na commitowanie i wysyłanie ukończonych zmian projektu Labus bez dodatkowego potwierdzenia. Po weryfikacji wykonaj commit i push na `main` w repozytorium `formic-studio/labus`.

## Skalowanie widoków

- Projekty referencyjne mają 1440 px na desktopie i 390 px na telefonie. W obu punktach baza wynosi `1rem = 10px` przy domyślnym rozmiarze pisma przeglądarki 16 px. Progi dotyczą szerokości viewportu w pikselach CSS.
- Na desktopie poniżej 1440 px rozmiary zapisane w `rem` mają płynnie maleć. Od 1440 do 1920 px baza pozostaje stała. Powyżej 1920 px rośnie płynnie do 3840 px, gdzie skalowanie osiąga sufit.
- Poniżej 390 px widok mobilny ma się zmniejszać tylko nieznacznie. Układy tabletowe i mobilne dostosowuj breakpointami Bricks, w tym liczbę kolumn i sposób łamania treści.
- Przy wdrożeniu ustaw `font-size` na `:root` w CSS motywu potomnego. Używaj procentowej bazy `62.5%` oraz ograniczonych przedziałów `clamp()`. W Bricks korzystaj z istniejących klas typografii i zmiennych rozmiarów oraz odstępów w `rem`. Interlinia pozostaje bez jednostki.
- Do pierwszej przymiarki przyjmij wstępnie domyślny próg desktopu Bricks 992 px z bazą 8.75 px na tym progu, bazę 10 px w zakresie 390–991 px, około 9 px przy 320 px i maksymalnie 15 px przy 3840 px. Dostosuj wartości po sprawdzeniu pierwszego szablonu.
- Przy wdrożeniu sprawdź widoki 320, 390, 992, 1440, 1920 i 3840 px. Sprawdź też czytelność, łamanie treści i obsługę strony przy powiększeniu tekstu do 200%.

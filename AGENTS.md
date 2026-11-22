# Zasady pracy nad Labus

- WordPress i Bricks renderują treść oraz strukturę strony. Pisz interakcje w modułowym TypeScript i utrzymuj je w `src/ts/`. W Bricks używaj semantycznych znaczników, czytelnych klas i atrybutów `data-*`.
- Rejestruj moduły w `src/ts/main.ts` przez `createComponentRegistry`. Preferuj selektory `data-component` dla korzeni i atrybuty `data-*` dla elementów wewnętrznych. Uruchamiaj moduł na podstawie DOM, bez zależności od slugów i adresów stron.
- Każda definicja musi mieć unikalną nazwę i import dynamiczny. Importuj ciężkie biblioteki wewnątrz modułów, które z nich korzystają. Dodawaj biblioteki tylko z uzasadnieniem. Frontend korzysta z natywnych API przeglądarki.
- Zachowuj progressive enhancement. Treść i nawigacja muszą działać bez JS. Używaj natywnej semantyki, wspieraj klawiaturę i widoczny fokus. Aktualizuj ARIA przy zmianie stanu, jeśli przeglądarka sama go nie udostępnia. Respektuj `prefers-reduced-motion`.
- Zachowuj zgodność z `bricks/ajax/nodes_added`. Komponent ma działać przy wielu instancjach, po doładowaniu AJAX oraz gdy na stronie brakuje jego selektora. Rejestr zapobiega wielokrotnemu montowaniu.
- Listenery globalne muszą mieć cleanup. Korzystaj z `AbortSignal` lub zwracaj funkcję usuwającą listenery i zwalniającą zasoby. Własne obserwatory, timery i instancje bibliotek kończ przy odmontowaniu.
- Zmiany PHP wprowadzaj w `inc/`, stosując WordPress Coding Standards. Korzystaj z udokumentowanych funkcji i hooków. Trzymaj sekrety, tokeny i pliki środowiskowe poza repozytorium.
- Każdy moduł musi przejść `npm run typecheck`, `npm run lint` i `npm run build`. Przed przekazaniem zmian uruchom `npm run check`. Po zmianach zatrzymaj watch, przebuduj i zaktualizuj cały `dist/` wraz z usunięciami. Commit obejmuje źródła i artefakty. Wykonaj commit lub push wyłącznie po wyraźnej zgodzie użytkownika.

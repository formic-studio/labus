# Labus

Motyw potomny Bricks dla projektu Labus, przygotowany przez Formic Studio. WordPress przechowuje treści, a Bricks renderuje strony, szablony i nawigację po stronie serwera. Vite kompiluje własne style oraz moduły TypeScript. Rejestr dobiera interakcje do elementów obecnych w DOM.

## Wymagania

- WordPress 6.5 lub nowszy (`wp_enqueue_script_module()`). Na produkcji używaj aktualnej, utrzymywanej wersji WordPressa.
- PHP 8.3 lub nowszy, baza danych zgodna z wymaganiami WordPressa i HTTPS na produkcji. [Wymagania WordPressa](https://wordpress.org/about/requirements/).
- Aktualny Bricks z aktywną licencją, zainstalowany jako motyw nadrzędny w katalogu `bricks`. Obsługiwane zdarzenie AJAX jest dostępne w Bricks od 1.11.1.
- Node.js 26 LTS zgodny z `.nvmrc`, npm 11.20 lub nowszy oraz Git na komputerze deweloperskim. Serwer WordPress potrzebuje gotowego `dist/`.
- Nowoczesne przeglądarki obsługujące natywne moduły ES oraz dynamiczny `import()`. Build używa domyślnego celu Vite 8. [Przeglądarki docelowe Vite](https://vite.dev/config/build-options.html#build-target).

## Instalacja lokalna

1. Uruchom lokalny WordPress i ustaw **Ustawienia → Ogólne → Język witryny → Polski**.
2. Zainstaluj Bricks i aktywuj jego licencję. Umieść repozytorium w `wp-content/themes/labus/`. Jeśli masz lokalny checkout poza WordPressem, zamontuj ten katalog w środowisku deweloperskim pod tą samą ścieżką.
3. W katalogu motywu uruchom poniższe polecenia.

   ```sh
   nvm install
   nvm use
   npm ci
   npm run build
   ```

4. Aktywuj **Labus** w **Wygląd → Motywy**. Otwórz publiczny podgląd strony, aby sprawdzić interakcje. W canvasie Bricks ładuje się CSS Labus. Panel edytora pomija oba pliki, a własny moduł JS działa na froncie. [Motyw potomny w Bricks Academy](https://academy.bricksbuilder.io/developer/guides/child-theme/).

## Polecenia npm

| Polecenie              | Działanie                                                               |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm ci`               | Instaluje zależności zapisane w `package-lock.json`.                    |
| `npm run dev`          | Obserwuje źródła i zapisuje niezmniejszony build z mapami źródłowymi.   |
| `npm run typecheck`    | Sprawdza TypeScript w trybie strict, bez emitowania plików.             |
| `npm run lint`         | Uruchamia ESLint wraz z regułami zależnymi od typów.                    |
| `npm run format`       | Formatuje obsługiwane pliki źródłowe i dokumentację przez Prettier.     |
| `npm run format:check` | Sprawdza formatowanie bez zapisywania zmian.                            |
| `npm run check`        | Uruchamia kontrolę typów, lint i sprawdzenie formatowania.              |
| `npm run build`        | Czyści `dist/` i zapisuje minifikowany build produkcyjny bez sourcemap. |

## Struktura

```text
.
├── style.css                     # Metadane i nagłówek motywu
├── functions.php                 # Bootstrap PHP
├── inc/
│   ├── assets.php                 # Enqueue i wykrywanie trybu Bricks
│   ├── helpers.php                # Wersjonowanie istniejących assetów
│   └── theme-setup.php            # Text domain labus
├── src/
│   ├── css/
│   │   ├── accessibility.css
│   │   └── main.css
│   └── ts/
│       ├── main.ts                # Punkt wejścia i lista komponentów
│       ├── components/example-disclosure.ts
│       ├── core/
│       │   ├── bricks-events.ts
│       │   ├── component-registry.ts
│       │   └── motion-preference.ts
│       └── types/bricks.d.ts
├── dist/
│   ├── main.css
│   ├── main.js
│   └── chunks/                   # Moduły opcjonalne z hashem w nazwie
├── .github/workflows/quality.yml
├── vite.config.ts
├── tsconfig.json
├── eslint.config.js
├── package.json
├── package-lock.json
└── AGENTS.md
```

Własne tłumaczenia można dodać do katalogu `languages/`. WordPress wyszukuje pliki tłumaczeń dla domeny `labus` i aktywnego języka witryny.

## Dodawanie komponentu

1. Zbuduj semantyczny HTML z działającym dostępem do treści i nawigacji także przy wyłączonym JS.
2. Utwórz `src/ts/components/nazwa-komponentu.ts` z eksportem `mount(element: Element, signal: AbortSignal): (() => void) | undefined`. Zawęź typ elementu i zweryfikuj strukturę przed modyfikacjami. Powiąż listenery z `signal` albo usuń je w zwracanej funkcji. Cleanup powinien również zwalniać timery, obserwatory i instancje bibliotek.
3. W `src/ts/main.ts` dopisz definicję z unikalną nazwą i selektorem. Dopasuj nazwę do wartości atrybutu.

   ```ts
   {
     name: 'nazwa-komponentu',
     selector: '[data-component="nazwa-komponentu"]',
     load: () => import('./components/nazwa-komponentu'),
   }
   ```

4. W Bricks na elemencie głównym wejdź w **Style → Attributes** i dodaj atrybut o nazwie `data-component` oraz wartości `nazwa-komponentu`. Sprawdź wynik w publicznym podglądzie. [Atrybuty własne w Bricks Academy](https://academy.bricksbuilder.io/builder/features/custom-attributes/).

### Przykład w Bricks

Dodaj element **Div**, ustaw **HTML tag → Custom → details** i dodaj `data-component` o wartości `example-disclosure`. Jako pierwsze dziecko dodaj **Basic Text** z własnym znacznikiem `summary` i etykietą. Pod nim umieść treść. Bricks powinien wyrenderować taką strukturę. [Div](https://academy.bricksbuilder.io/builder/elements/layout/div/), [Basic Text](https://academy.bricksbuilder.io/builder/elements/basic/text-basic/).

```html
<details data-component="example-disclosure">
  <summary>Informacje dodatkowe</summary>
  <p>Treść dostępna po rozwinięciu.</p>
</details>
```

Przeglądarka udostępnia obsługę Enter i Spacji oraz informuje technologie wspomagające o stanie rozwinięcia. TypeScript pozwala domknąć sekcję klawiszem Escape i przywraca fokus na `summary`. Początkowy stan ustala HTML. Przykładowy moduł nie dodaje animacji ani nie zmienia widoczności podczas montowania.

## Dynamiczny import i Bricks AJAX

Po gotowości DOM rejestr wyszukuje zarejestrowane atrybuty. Pierwsze dopasowanie uruchamia `import()`, a elementy danego komponentu współdzielą obietnicę załadowania modułu. Rejestr zapisuje instancję przed rozpoczęciem importu, więc kolejne skany nie dublują montowania. Błąd importu, montowania lub sprzątania zapisuje komunikat w konsoli z nazwą komponentu i pozostawia pozostałe komponenty aktywne.

Bricks emituje `bricks/ajax/nodes_added` po wstawieniu wyników. Adapter nasłuchuje na `document`, a rejestr ponawia skan. Publiczny kontrakt zdarzenia dokumentuje `detail.queryId`, więc skan nie zależy od przekazania węzłów ani od konkretnego Query Loop. Usunięte korzenie zwalniają zasoby, także gdy AJAX zwróci pustą listę. Kod odpinający listenery może korzystać z przekazanego `AbortSignal`. [Zdarzenia JavaScript w Bricks Academy](https://academy.bricksbuilder.io/developer/guides/custom-javascript-events-in-bricks/).

Ciężką bibliotekę importuj w module komponentu, który jej potrzebuje. Statyczny import wewnątrz modułu ładowanego leniwie utrzymuje bibliotekę poza głównym wejściem, o ile żaden moduł startowy jej nie importuje. Jeśli ma się ładować dopiero po akcji użytkownika, użyj kolejnego `import()` w obsłudze tej akcji. Style specyficzne dla biblioteki można importować w tym samym module. Style wymagane przed uruchomieniem JS umieszczaj w `src/css/`.

## Praca i build produkcyjny

1. Uruchom `npm run dev`. Watch zapisuje pliki do `dist/`, a WordPress podaje je na publicznym podglądzie po odświeżeniu strony. Po zmianie konfiguracji Vite uruchom watch ponownie.
2. Zmieniaj frontend w `src/`, a integracje PHP w `inc/`. Sprawdź stronę z komponentem i bez niego. W przypadku nowych interakcji sprawdź klawiaturę, wyłączony JavaScript i preferencję ograniczenia ruchu. Moduły zawierające ruch mogą przed jego uruchomieniem odczytać ją przez `prefersReducedMotion()`.
3. Zatrzymaj watch i uruchom `npm run check`, a następnie `npm run build`.
4. Zacommituj źródła, ewentualne zmiany w lockfile i **cały bieżący `dist/`**, razem z usunięciami poprzednich chunków. Wysyłaj zmiany produkcyjne na `main` po przejściu kontroli.

WordPress ładuje `dist/main.css` i `dist/main.js`, dodając czas modyfikacji pliku (`filemtime`) do adresu. Główny JS jest modułem ES. Vite wylicza adresy chunków względem plików w `dist/`, dzięki czemu działają również w WordPressie zainstalowanym w podkatalogu. GitHub Actions instaluje zależności poleceniem `npm ci`, uruchamia kontrole, przebudowuje projekt i sprawdza, czy build zmienił, usunął lub dodał pliki w `dist/`.

### Gdy `dist/` jest nieaktualny

1. Zatrzymaj watch. Użyj Node z `.nvmrc`, uruchom `npm ci` i `npm run build`.
2. Sprawdź `git status --short --untracked-files=all -- dist/`. Dodaj cały katalog przez `git add -A -- dist/`, w tym nowe pliki i usunięcia.
3. Jeśli problem występuje dopiero po wdrożeniu, sprawdź commit na `main` i stan aktualizacji WP Pusher. W zakładce Network sprawdź odpowiedzi dla `main.js`, `main.css` i leniwego chunka. Przy starych adresach lub błędach 404 odśwież cache strony i CDN. Sprawdź wtyczkę optymalizacyjną, jeśli zmienia tag `type="module"`, ścieżki lub łączy skrypty.

## Wdrożenie GitHub → WP Pusher

1. Na WordPressie z zainstalowanym Bricks zainstaluj i połącz WP Pusher z kontem GitHub. Przy prywatnym repozytorium użyj licencji i konfiguracji uwierzytelnienia WP Pusher w panelu WordPress.
2. W **WP Pusher → Install Theme** ustaw host **GitHub**, repozytorium **formic-studio/labus**, wyraźnie wpisz branch **main**, a pole podkatalogu pozostaw puste. Jeśli motyw jest już zainstalowany jako `labus`, użyj opcji podłączenia istniejącego motywu. [Instalacja motywu w WP Pusher](https://docs.wppusher.com/article/13-working-with-plugins-and-themes).
3. Zainstaluj i aktywuj motyw Labus. Pierwsze wdrożenie sprawdź na stagingu. Przy ręcznej aktualizacji użyj **Update theme**. Gdy włączasz **Push-to-Deploy**, ustaw na GitHub wymagany status `quality` przed scaleniem PR do `main`, ponieważ webhook wdrożeniowy reaguje na push. [Automatyczne wdrożenia WP Pusher](https://wppusher.com/wordpress-deployment-guide/).
4. Zweryfikuj publiczną stronę i canvas edytora po aktualizacji. Treść, szablony Bricks i ustawienia witryny pozostają w bazie WordPressa. WP Pusher wdraża pliki motywu z GitHub.

### Przed wdrożeniem

- [ ] Na WordPressie działa aktualny Bricks z licencją, motyw Labus jest aktywny i ustawiono język polski.
- [ ] Kontrole jakości i produkcyjny build przeszły, a commit zawiera cały `dist/`.
- [ ] Główny CSS i moduł JS zwracają HTTP 200 na froncie. W canvasie ładuje się CSS i można edytować stronę bez skryptu Labus.
- [ ] Nawigacja i treść działają z wyłączonym JS. Fokus jest widoczny, a dostępne interakcje działają z klawiatury.
- [ ] Jeśli strona używa Bricks Query Loop z AJAX, doładowane komponenty działają po dodaniu wyników i po ich wymianie.
- [ ] WP Pusher wskazuje repozytorium i gałąź `main`.

Po zbudowaniu pierwszych szablonów można dodać testy Playwright na stagingu i automatyczne sprawdzanie axe dla kluczowych widoków. Walidację automatyczną uzupełnij ręczną obsługą klawiaturą i czytnikiem ekranu. Docelowy poziom zgodności dostępności wymaga ustalenia w projekcie.

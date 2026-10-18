# GIS Frontend

Фронтенд геоинформационной системы оценки инвестиционного потенциала Норильска.
Лабораторная 1: главная страница и карта четырёх районов.

- Frontend: https://github.com/artem5438/gis-frontend
- Backend: https://github.com/artem5438/gis-backend

## Стек

- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [Vite](https://vite.dev/guide/)
- [React-Bootstrap](https://react-bootstrap.github.io/)
- [React Router](https://reactrouter.com/)
- [Leaflet](https://leafletjs.com/reference.html) и тайлы [OpenStreetMap](https://www.openstreetmap.org/copyright)

## Структура

```
src/components   шапка
src/pages        Главная и Карта
src/data         центры четырёх районов
```

Компоненты и страницы — PascalCase (`HomePage.tsx`). Стили вынесены в `src/styles.css`. Фон `#F5F5F5`, текст `#1C1C1C`, акцент `#1F4B5A`.

На карте отмечены районы: Центральный, Талнах, Кайеркан, Оганер. Инвестиционных площадок ещё нет.

## Переменные окружения

```bash
cp .env.example .env
```

`VITE_API_BASE` — префикс API. В разработке Vite проксирует `/api` на `http://localhost:8080`. В Docker nginx делает то же самое внутри сети Compose. Файл `.env` для лабораторной 1 не обязателен.

## Запуск для разработки

```bash
npm install
npm run dev
```

Сайт: http://localhost:5173

Проверки:

```bash
npm run lint
npm run build
```

## Запуск вместе с бэкендом

Из каталога `gis-backend`:

```bash
docker compose up --build
```

Сайт открывается на http://localhost. Контейнер собирает этот репозиторий и отдаёт его через nginx.

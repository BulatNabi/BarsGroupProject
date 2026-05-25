
# 404 Brain Not Found Team
### Хост


* **Панель администратора:** [AdminPanel](https://404-brain-not-found.ru)
* **Telegram miniApps:** [MiniApps](t.me/team404brainnotfound_bot) (После старта внизу слева кнопка 'START') 

### Установка и Запуск

1.  **Клонируйте репозиторий (если применимо):**
    ```bash
    git clone https://github.com/BulatNabi/BarsGroupProject.git
    cd ./BarsGroupProject
    ```
    *Если у вас просто файлы проекта с `docker-compose.yml`, перейдите в эту папку.*

2.  **Соберите и запустите сервисы:**
    Перейдите в директорию с файлом `docker-compose.yml` и выполните следующую команду:
    ```bash
    docker compose up --build -d
    ```

3.  **Проверка статуса контейнеров:**
    Вы можете убедиться, что контейнеры запущены, выполнив:
    ```bash
    docker compose ps
    ```

### Хранилище медиа (MinIO)

Медиа курсов (фото, видео, аудио, PDF) хранятся в S3-совместимом MinIO,
бакет `bars-courses`. Бэкенд обращается к нему по адресу `https://dev.mocki.ru`
(`S3Config__ServiceURL` в `.env`), который host nginx проксирует на
`127.0.0.1:9010`.

Это **общая инфраструктура хоста** (тем же MinIO пользуется пайплайн RegTech),
поэтому она вынесена в отдельный compose-файл и запускается отдельно:

```bash
docker compose -f deploy/minio-compose.yaml up -d
```

Если MinIO не запущен, `https://dev.mocki.ru` отдаёт **502 Bad Gateway**, и
любая загрузка/отдача медиа в приложении ломается (API при этом сам по себе
отвечает 200 на JSON — симптом выглядит как «502 от бэкенда»).
Консоль MinIO: `http://localhost:9011` (логин `regtech` / `regtech_secret123`).

### Доступ к приложению

После успешного запуска, ваше приложение будет доступно по адресу:

* **Основное приложение:** `http://localhost` 


### Остановка приложения

Чтобы остановить и удалить контейнеры, сети и тома, созданные `docker compose up`, выполните в той же директории:

```bash
docker compose down
```

### Разработчики
* **Backend Dev (Набиуллин Булат):** `t.me/talubarni`
* **Frontend Dev (Гатин Разиль):** `t.me/Mazzotta33`
  
  

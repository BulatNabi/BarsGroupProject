# 404 Brain Not Found Team

### Хост


* **Панель администратора:** [AdminPanel](https://404-brain-not-found.ru)
* **Telegram miniApps:** [MiniApps](t.me/team404brainnotfound_bot) (После старта внизу слева кнопка 'START') 

### Установка и Запуск

1.  **Клонируйте репозиторий (если применимо):**
    ```bash
    git clone https://github.com/BulatNabi/BarsGroupProject-test.git
    cd ./BarsGroupProject-test
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

### Доступ к приложению

После успешного запуска, ваше приложение будет доступно по адресу:

* **Основное приложение:** `http://localhost` 


### Остановка приложения

Чтобы остановить и удалить контейнеры, сети и тома, созданные `docker compose up`, выполните в той же директории:

```bash
docker compose down

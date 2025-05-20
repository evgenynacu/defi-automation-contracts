FROM alpine:3.19

# Устанавливаем нужные утилиты
RUN apk add --no-cache bash curl gettext unzip

# Скачиваем и распаковываем Alloy
RUN curl -LO https://github.com/grafana/alloy/releases/download/v1.8.3/alloy-linux-amd64.zip
RUN unzip alloy-linux-amd64.zip
RUN mv alloy-linux-amd64 /usr/bin/alloy
RUN chmod +x /usr/bin/alloy
RUN rm -rf alloy-linux-amd64*

# Копируем шаблон и скрипт
COPY config.alloy.tmpl /etc/config.alloy.tmpl
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
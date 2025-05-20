#!/bin/sh
set -e

# Заменяем переменные окружения в конфиге
envsubst < /etc/config.alloy.tmpl > /etc/config.alloy.hcl

# Запускаем alloy
exec /usr/bin/alloy run /etc/config.alloy.hcl
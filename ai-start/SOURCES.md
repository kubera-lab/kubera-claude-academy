# Источники идей

Проверено 25.11.2026. Отсюда взяты только образовательные принципы. Тексты, картинки и вопросы курса написаны заново, чужие материалы не копировались.

| Проект | Что взяли |
|---|---|
| [Правительство Токио: AI-литерация для жителей](https://www.digitalservice.metro.tokyo.lg.jp/business/ai/ai-literacy) | Короткие жизненные истории (например, рецепт от ИИ, который нельзя принимать без проверки) и объяснение ошибок |
| [Microsoft, Generative AI for Beginners](https://github.com/microsoft/generative-ai-for-beginners) и [AI for Beginners](https://github.com/microsoft/ai-for-beginners) | Последовательные короткие уроки, тест после урока, самостоятельный темп, несколько языков |
| [Hugging Face, AI Agents Course](https://huggingface.co/learn/agents-course/en/unit0/introduction) | Интерактивные задания и подтверждение знаний (значок курса). Программирование убрали |
| [JDLA, AI for Everyone](https://www.jdla.org/certificate/everyone/) | Объяснение ИИ людям без технического образования. Наш курс остаётся бесплатным |
| [Open University, AI Fluency](https://www.open.edu/openlearn/digital-computing/ai-fluency) | Практическая польза: письма, планирование, безопасность |
| [Elements of AI](https://www.elementsofai.com/) | Курс «для всех» без кода и сложной математики |
| [生成AIパスポート (GUGA), статья @IT](https://atmarkit.itmedia.co.jp/ait/articles/2606/25/news048.html) | Короткий экзамен на базовую ИИ-грамотность с упором на риски. Идея для будущего итогового теста |
| [METI / IPA Manabi DX Quest](https://www.meti.go.jp/policy/it_policy/jinzai/MDXQuestText_Digests_2024.pdf) | Обучение через рабочие ситуации. У нас каждый урок начинается с реальной задачи |
| Дело Mata v. Avianca (США, 2023) | Реальный пример галлюцинаций в уроке 4: юристов оштрафовали на 5000 долларов за выдуманные ИИ ссылки на судебные решения |

Японский подход микрообучения: маленькие последовательные шаги, визуальные объяснения, постепенное усложнение. В уроке это пять шагов с полосой прогресса.

## Лаборатория KUBERA, курс 1 «Технологии мебельной фабрики»

Учебная мебельная фабрика — обезличенный пример. Факты уроков взяты из кода и проверенных отчётов реального проекта KUBERA на учебных данных (сверено 28.11.2026). Название проекта и его внутренние детали (адреса сайтов и сервера, номера заказов и задач, точные счётчики) в публичную школу не переносятся. Официальные страницы ниже проверены 28.11.2026: каждая открылась, и указанный факт на ней найден.

| Источник | Урок | Что сверено 28.11.2026 | Итог |
|---|---|---|---|
| [Cloudflare Workers AI: цены](https://developers.cloudflare.com/workers-ai/platform/pricing/) | 5 | 10 000 нейронов в день бесплатно; $0.011 за 1 000 нейронов сверх | PASS |
| [Cloudflare D1: цены](https://developers.cloudflare.com/d1/platform/pricing/) | 5 | 5 млн чтений и 100 тыс. записей в день, 5 ГБ на бесплатном плане | PASS |
| [Cloudflare D1: лимиты](https://developers.cloudflare.com/d1/platform/limits/) | 5 | база до 500 МБ на бесплатном плане | PASS |
| [Cloudflare D1: Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/) | 6 | 7 дней на бесплатном плане, 30 дней на платном | PASS |
| [Mozilla pdf.js](https://mozilla.github.io/pdf.js/) | 2 | лицензия Apache-2.0 | PASS |
| [Tesseract OCR](https://github.com/tesseract-ocr/tesseract) | 2 | лицензия Apache-2.0 | PASS |
| [RFC 6238 (TOTP)](https://datatracker.ietf.org/doc/html/rfc6238) | 3 | шаг времени 30 секунд | PASS |
| [NCSC: двухэтапная проверка](https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/activate-2-step-verification-on-your-email) | 3 | рекомендация включить 2SV | PASS |
| [GitHub Docs: pull requests](https://docs.github.com/en/pull-requests) | 4 | раздел документации о pull request (старая длинная ссылка вела на другую страницу и заменена) | PASS |
| [UK Government Data Quality Framework](https://www.gov.uk/government/publications/the-government-data-quality-framework) | 1 | страница открывается; перечень измерений качества дословно не сверялся | PASS (страница), NOT TESTED (измерения) |

## Лаборатория KUBERA, курс 2 «Локальный ИИ и агенты»

Факты курса взяты из контрольной проверки помощника Замбала 28.11.2026 (результаты команд и ответы на учебных задачах). Имена компьютеров, пути к файлам и учётные данные в уроки не переносятся. Официальные страницы проверены 28.11.2026.

| Источник | Урок | Что сверено 28.11.2026 | Итог |
|---|---|---|---|
| [Ollama на GitHub](https://github.com/ollama/ollama) | 1 | лицензия MIT | PASS |
| [Ollama FAQ](https://github.com/ollama/ollama/blob/main/docs/faq.md) | 1 | по умолчанию адрес 127.0.0.1, порт 11434; модель держится в памяти 5 минут | PASS |
| [Qwen/Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct) | 1, 2 | лицензия apache-2.0, около 0,5 млрд параметров | PASS |
| [impira/layoutlm-invoices](https://huggingface.co/impira/layoutlm-invoices) | 2 | лицензия cc-by-nc-sa-4.0 | PASS |
| [Creative Commons BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) | 2 | NonCommercial: нельзя использовать в коммерческих целях | PASS |
| [Model Context Protocol](https://modelcontextprotocol.io/introduction) | 5 | определение MCP: открытый стандарт подключения ИИ-приложений к внешним системам | PASS |
| [Microsoft Learn: триггеры Планировщика заданий](https://learn.microsoft.com/windows/win32/taskschd/trigger-types) | 6 | триггеры по времени и по входу пользователя; режим «только для вошедшего пользователя» | PASS |

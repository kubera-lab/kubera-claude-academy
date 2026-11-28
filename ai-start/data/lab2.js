// «Лаборатория KUBERA», курс 2: локальный ИИ и агенты на примере помощника KUBERA «Замбала» (Dzambala).
// Только то, что реально запущено и проверено 28.11.2026; непроверенное помечено в тексте как «ещё не проверено».
// Внутренних данных проектов и имён компьютеров здесь нет. Формат тот же, что в lab1.js.
// key — номера правильных ответов (с 0), одинаковы для обоих языков.

export const LAB2 = {
  "id": "k2",
  "lessons": [
    {
      "id": "k2l1",
      "minutes": 8,
      "area": "Local AI",
      "key": [
        2,
        0,
        3,
        1
      ],
      "ru": {
        "title": "Локальная модель и Ollama",
        "situation": "У Замбалы, помощника KUBERA, есть своя модель ИИ прямо на Mini PC. Она работает без интернета и без оплаты. На вопрос «сколько будет 2+2» она ответила «2+2 equals 4.» за 21 секунду, загрузив процессор на 100%. Почему так медленно, и когда своя модель всё равно выгодна?",
        "points": [
          [
            "Локальная модель",
            "Local model — модель ИИ, которая работает на вашем компьютере, а не в облаке. Ваши тексты никуда не уходят, и за ответы никто не платит. Платите вы скоростью: всё считает ваш процессор."
          ],
          [
            "Ollama",
            "Ollama — бесплатная программа (лицензия MIT), которая скачивает модели и запускает их на компьютере. По своей документации она по умолчанию слушает только адрес 127.0.0.1, то есть доступна лишь с этого же компьютера. Открывать её в интернет нельзя."
          ],
          [
            "Размер модели",
            "Модель qwen2.5:0.5b — около 0,5 млрд параметров, файл 397 МБ, лицензия Apache-2.0. Маленькая модель помещается в слабый компьютер, но пишет проще и ошибается чаще. Модели 7–8 млрд параметров умнее, но им нужно больше памяти."
          ],
          [
            "Что проверено",
            "На старом Mini PC (Celeron, 7,8 ГБ памяти) реальна только маленькая модель: простой ответ 21 с, ответ с исследованием около 2 минут. Модель 7–8B на новом компьютере (Ryzen 7, 32 ГБ) — следующий шаг, он ещё не проверен."
          ]
        ],
        "terms": [
          [
            "Local model",
            "локальная модель",
            "ло́кал мо́дел"
          ],
          [
            "Parameters",
            "параметры модели (её «размер»)",
            "пэра́метрз"
          ],
          [
            "Quantization",
            "квантование (сжатие модели)",
            "квантизэ́йшн"
          ],
          [
            "Inference",
            "вычисление ответа моделью",
            "и́нференс"
          ],
          [
            "Localhost",
            "этот же компьютер (127.0.0.1)",
            "ло́кал-хост"
          ]
        ],
        "compare": {
          "title": "Разбор: облачная и локальная модель",
          "bad": "«Поставим самую большую модель на Mini PC, и она заменит облачный ИИ». Компьютер не тянет, ответ идёт минутами, остальные программы тормозят.",
          "good": "Маленькая локальная модель пишет короткие ответы по фактам, которые собрала программа. Сложные задачи уходят облачным помощникам через очередь задач.",
          "why": "Локальная модель бесплатна и приватна, но её сила ограничена железом. Её ставят туда, где она реально справляется."
        },
        "practice": "Посчитайте сами: если простой ответ занимает 21 секунду, а ответ с исследованием около 2 минут, сколько исследовательских ответов Замбала успеет за час, если ничего больше не делать? Потом подумайте, какие ваши задачи могут подождать 2 минуты, а какие нет.",
        "prompt": "Объясни простыми словами разницу между локальной моделью ИИ и облачной. Дай по 3 плюса и минуса каждой для маленькой компании. Не придумывай цены: если не знаешь точной цифры, так и напиши.",
        "takeaways": [
          "Локальная модель бесплатна и не отправляет данные наружу, но скорость зависит от вашего компьютера.",
          "Ollama по умолчанию доступна только с этого же компьютера, и так должно оставаться.",
          "Размер модели выбирают по памяти компьютера, а не «чем больше, тем лучше»."
        ],
        "quiz": [
          {
            "q": "Почему локальная модель на старом Mini PC отвечала 21 секунду на простой вопрос?",
            "o": [
              [
                "Медленный интернет",
                "Локальной модели интернет для ответа не нужен."
              ],
              [
                "Сервер Ollama в другой стране",
                "Ollama работает на этом же компьютере."
              ],
              [
                "Все вычисления делает слабый процессор этого компьютера",
                "Верно. Локальная модель считает на вашем железе: слабый процессор, значит медленный ответ."
              ],
              [
                "Модель платная и ждёт оплаты",
                "qwen2.5:0.5b бесплатна, лицензия Apache-2.0."
              ]
            ]
          },
          {
            "q": "Какой адрес Ollama слушает по умолчанию и что это значит?",
            "o": [
              [
                "127.0.0.1 — доступ только с этого же компьютера",
                "Верно. Это localhost: снаружи к модели не подключиться, и это правильно."
              ],
              [
                "Любой адрес — доступ из интернета",
                "Нет, по умолчанию только этот компьютер. Открывать модель в интернет нельзя."
              ],
              [
                "Адрес сайта Hugging Face",
                "Hugging Face — каталог моделей, а не адрес работы Ollama."
              ],
              [
                "Адрес облака Cloudflare",
                "Ollama не связана с Cloudflare."
              ]
            ]
          },
          {
            "q": "Как по-английски «квантование (сжатие модели)» и как произносится?",
            "o": [
              [
                "Inference — и́нференс",
                "Это вычисление ответа, а не сжатие."
              ],
              [
                "Parameters — пэра́метрз",
                "Это размер модели, а не способ сжатия."
              ],
              [
                "Localhost — ло́кал-хост",
                "Это «этот же компьютер»."
              ],
              [
                "Quantization — квантизэ́йшн",
                "Верно. Квантование уменьшает модель, чтобы она поместилась в память компьютера."
              ]
            ]
          },
          {
            "q": "Что из этого уже проверено, а что ещё нет?",
            "o": [
              [
                "Обе модели проверены и работают",
                "Модель 7–8B на новом компьютере ещё не запускали."
              ],
              [
                "Маленькая модель на старом Mini PC проверена; модель 7–8B на новом компьютере ещё нет",
                "Верно. Говорим «проверено» только про то, что реально запускали."
              ],
              [
                "Ничего не проверено",
                "Маленькая модель проверена: ответ «2+2 equals 4.» за 21 секунду."
              ],
              [
                "Модель 7–8B проверена на старом Mini PC",
                "На старом компьютере реальна только маленькая модель."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "A local model and Ollama",
        "situation": "Dzambala, the KUBERA assistant, has its own AI model right on the Mini PC. It works offline and costs nothing. Asked \"what is 2+2\", it answered \"2+2 equals 4.\" in 21 seconds with the processor at 100%. Why so slow, and when is your own model still worth it?",
        "points": [
          [
            "Local model",
            "A local model is an AI model that runs on your computer, not in the cloud. Your texts stay with you and nobody pays per answer. You pay in speed: your own processor does all the work."
          ],
          [
            "Ollama",
            "Ollama is a free program (MIT licence) that downloads models and runs them on your computer. Its documentation says that by default it listens only on 127.0.0.1, so it can be reached only from the same computer. It must not be opened to the internet."
          ],
          [
            "Model size",
            "qwen2.5:0.5b has about 0.5 billion parameters, a 397 MB file and an Apache-2.0 licence. A small model fits a weak computer but writes more simply and makes more mistakes. 7–8 billion parameter models are smarter but need more memory."
          ],
          [
            "What was tested",
            "On the old Mini PC (Celeron, 7.8 GB memory) only a small model is realistic: a simple answer took 21 s, an answer with research about 2 minutes. A 7–8B model on the new computer (Ryzen 7, 32 GB) is the next step and has not been tested yet."
          ]
        ],
        "terms": [
          [
            "Local model",
            "an AI model running on your own computer",
            "LOH-kul MOD-ul"
          ],
          [
            "Parameters",
            "the numbers inside a model (its \"size\")",
            "puh-RAM-ih-turz"
          ],
          [
            "Quantization",
            "shrinking a model to fit in memory",
            "kwon-tih-ZAY-shun"
          ],
          [
            "Inference",
            "the model working out an answer",
            "IN-fur-ence"
          ],
          [
            "Localhost",
            "this same computer (127.0.0.1)",
            "LOH-kul-host"
          ]
        ],
        "compare": {
          "title": "Case study: a cloud model and a local model",
          "bad": "\"Let's put the biggest model on the Mini PC and it will replace cloud AI.\" The computer cannot cope, answers take minutes and other programs slow down.",
          "good": "A small local model writes short answers from facts the program has gathered. Hard tasks go to the cloud assistants through the task queue.",
          "why": "A local model is free and private, but its power is limited by the hardware. Put it where it really copes."
        },
        "practice": "Work it out: if a simple answer takes 21 seconds and an answer with research about 2 minutes, how many research answers can Dzambala give in an hour doing nothing else? Then think which of your tasks can wait 2 minutes and which cannot.",
        "prompt": "Explain in plain words the difference between a local AI model and a cloud one. Give 3 pros and 3 cons of each for a small company. Do not invent prices: if you do not know an exact figure, say so.",
        "takeaways": [
          "A local model is free and keeps data in, but its speed depends on your computer.",
          "By default Ollama can be reached only from the same computer, and it should stay that way.",
          "Choose model size by the computer's memory, not \"the bigger the better\"."
        ],
        "quiz": [
          {
            "q": "Why did the local model on the old Mini PC take 21 seconds for a simple question?",
            "o": [
              [
                "Slow internet",
                "A local model does not need the internet to answer."
              ],
              [
                "The Ollama server is in another country",
                "Ollama runs on the same computer."
              ],
              [
                "All the computing is done by that computer's weak processor",
                "Correct. A local model computes on your hardware: a weak processor means a slow answer."
              ],
              [
                "The model is paid and waits for payment",
                "qwen2.5:0.5b is free, Apache-2.0 licence."
              ]
            ]
          },
          {
            "q": "Which address does Ollama listen on by default, and what does it mean?",
            "o": [
              [
                "127.0.0.1 — reachable only from the same computer",
                "Correct. That is localhost: nobody outside can connect, which is right."
              ],
              [
                "Any address — reachable from the internet",
                "No, only this computer by default. The model must not be opened to the internet."
              ],
              [
                "The Hugging Face website",
                "Hugging Face is a model catalogue, not where Ollama runs."
              ],
              [
                "The Cloudflare cloud",
                "Ollama has nothing to do with Cloudflare."
              ]
            ]
          },
          {
            "q": "What is the English for shrinking a model to fit in memory, and how is it said?",
            "o": [
              [
                "Inference — IN-fur-ence",
                "That is working out an answer, not shrinking."
              ],
              [
                "Parameters — puh-RAM-ih-turz",
                "That is the model's size, not a way to shrink it."
              ],
              [
                "Localhost — LOH-kul-host",
                "That means \"this same computer\"."
              ],
              [
                "Quantization — kwon-tih-ZAY-shun",
                "Correct. Quantization makes a model smaller so it fits the computer's memory."
              ]
            ]
          },
          {
            "q": "What has been tested, and what not yet?",
            "o": [
              [
                "Both models are tested and work",
                "The 7–8B model on the new computer has not been run yet."
              ],
              [
                "The small model on the old Mini PC is tested; a 7–8B model on the new computer is not yet",
                "Correct. Say \"tested\" only about what was really run."
              ],
              [
                "Nothing is tested",
                "The small model is tested: \"2+2 equals 4.\" in 21 seconds."
              ],
              [
                "The 7–8B model was tested on the old Mini PC",
                "Only a small model is realistic on the old computer."
              ]
            ]
          }
        ]
      }
    },
    {
      "id": "k2l2",
      "minutes": 7,
      "area": "Open Models",
      "key": [
        0,
        3,
        1,
        2
      ],
      "ru": {
        "title": "Модели на Hugging Face и их лицензии",
        "situation": "Замбала искала на Hugging Face модели для чтения счетов. Нашлась популярная модель layoutlm-invoices: больше миллиона скачиваний, и умеет именно счета. Но у неё лицензия cc-by-nc-sa-4.0. Можно ли взять её для работы предприятия?",
        "points": [
          [
            "Hugging Face",
            "Hugging Face — крупнейший каталог открытых моделей и наборов данных. У каждой модели есть карточка: что она умеет, размер и лицензия. Скачать модель можно бесплатно, но пользоваться ею можно только по правилам лицензии."
          ],
          [
            "Разрешительные лицензии",
            "Apache-2.0 и MIT разрешают коммерческое использование, если сохранить уведомление об авторстве. Под Apache-2.0 выпущены, например, qwen2.5 и Tesseract, под MIT — программа Ollama."
          ],
          [
            "Некоммерческие лицензии",
            "NC в названии (NonCommercial) означает: нельзя использовать в коммерческих целях. По тексту Creative Commons коммерческое — то, что в первую очередь направлено на выгоду или оплату. Работа предприятия — коммерческая, поэтому layoutlm-invoices для неё не подходит."
          ],
          [
            "Как проверять",
            "Лицензию смотрят в карточке модели на Hugging Face, а не в пересказе. Популярность модели ничего не говорит о том, разрешено ли её использовать в бизнесе."
          ]
        ],
        "terms": [
          [
            "License",
            "лицензия (правила использования)",
            "ла́йсенс"
          ],
          [
            "Open source",
            "открытый исходный код",
            "о́упен сорс"
          ],
          [
            "Commercial use",
            "коммерческое использование",
            "комёршл юс"
          ],
          [
            "Model card",
            "карточка модели",
            "мо́дел кард"
          ],
          [
            "Dataset",
            "набор данных",
            "дэ́йтасет"
          ]
        ],
        "compare": {
          "title": "Разбор: как выбрать модель для бизнеса",
          "bad": "«Модель популярная и бесплатная, значит, берём». А в карточке лицензия NC, и пользоваться ею в работе предприятия нельзя.",
          "good": "Сначала открыть карточку модели и прочитать лицензию. Apache-2.0 или MIT — можно рассматривать. NC — только для учёбы и опытов.",
          "why": "Бесплатно скачать и законно использовать в бизнесе — разные вещи. Ошибку с лицензией потом дорого исправлять."
        },
        "practice": "Откройте на Hugging Face страницу модели Qwen/Qwen2.5-0.5B-Instruct и найдите в карточке строку License. Потом откройте impira/layoutlm-invoices и сравните. Запишите, какая из них подходит для работы предприятия и почему.",
        "prompt": "Объясни простыми словами, чем отличаются лицензии Apache-2.0, MIT и CC BY-NC-SA 4.0 для маленькой компании, которая хочет использовать модель ИИ в работе. Если не уверен в каком-то условии, так и напиши и посоветуй, где проверить.",
        "takeaways": [
          "Лицензию читают в карточке модели, а не верят пересказу.",
          "Apache-2.0 и MIT разрешают коммерческое использование; NC запрещает.",
          "Популярность и бесплатность модели не означают, что ею можно пользоваться в бизнесе."
        ],
        "quiz": [
          {
            "q": "Можно ли использовать layoutlm-invoices (лицензия cc-by-nc-sa-4.0) в работе предприятия?",
            "o": [
              [
                "Нет: NC означает запрет на коммерческое использование",
                "Верно. Работа предприятия — коммерческая, поэтому эта модель только для учёбы."
              ],
              [
                "Да, раз её можно скачать бесплатно",
                "Бесплатное скачивание не даёт права на коммерческое использование."
              ],
              [
                "Да, у неё больше миллиона скачиваний",
                "Популярность не меняет лицензию."
              ],
              [
                "Да, если не говорить, что это ИИ",
                "Лицензию так не обойти, и скрывать использование ИИ неправильно."
              ]
            ]
          },
          {
            "q": "Какие лицензии разрешают коммерческое использование?",
            "o": [
              [
                "Только CC BY-NC-SA 4.0",
                "NC как раз запрещает коммерческое использование."
              ],
              [
                "Никакие открытые лицензии",
                "Многие открытые лицензии разрешают, например Apache-2.0 и MIT."
              ],
              [
                "Любая, если модель на Hugging Face",
                "На Hugging Face есть модели с разными лицензиями."
              ],
              [
                "Apache-2.0 и MIT",
                "Верно. Обе разрешают, если сохранить уведомление об авторстве."
              ]
            ]
          },
          {
            "q": "Где надёжнее всего проверить лицензию модели?",
            "o": [
              [
                "В ответе чат-бота",
                "Чат-бот может ошибиться. Проверяют по первоисточнику."
              ],
              [
                "В карточке модели на Hugging Face",
                "Верно. Это первоисточник: строка License в карточке."
              ],
              [
                "По числу скачиваний",
                "Скачивания ничего не говорят о лицензии."
              ],
              [
                "В рекламе модели",
                "Реклама не заменяет текст лицензии."
              ]
            ]
          },
          {
            "q": "Как по-английски «коммерческое использование» и как произносится?",
            "o": [
              [
                "Open source — о́упен сорс",
                "Это «открытый исходный код»."
              ],
              [
                "Model card — мо́дел кард",
                "Это «карточка модели»."
              ],
              [
                "Commercial use — комёршл юс",
                "Верно. Именно это запрещают лицензии с буквами NC."
              ],
              [
                "Dataset — дэ́йтасет",
                "Это «набор данных»."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "Models on Hugging Face and their licences",
        "situation": "Dzambala searched Hugging Face for models that read invoices. It found a popular one, layoutlm-invoices: over a million downloads, and made for invoices. But its licence is cc-by-nc-sa-4.0. Can a business use it?",
        "points": [
          [
            "Hugging Face",
            "Hugging Face is the largest catalogue of open models and datasets. Each model has a card: what it does, its size and its licence. Downloading is free, but you may use a model only under its licence."
          ],
          [
            "Permissive licences",
            "Apache-2.0 and MIT allow commercial use as long as you keep the copyright notice. qwen2.5 and Tesseract, for example, are Apache-2.0; the Ollama program is MIT."
          ],
          [
            "Non-commercial licences",
            "NC in the name (NonCommercial) means you may not use it for commercial purposes. Creative Commons defines commercial as primarily intended for commercial advantage or payment. Running a business is commercial, so layoutlm-invoices does not fit."
          ],
          [
            "How to check",
            "Read the licence on the model card on Hugging Face, not in someone's summary. Popularity says nothing about whether a business may use the model."
          ]
        ],
        "terms": [
          [
            "License",
            "the rules for using something",
            "LY-sence"
          ],
          [
            "Open source",
            "source code anyone can read",
            "OH-pun sors"
          ],
          [
            "Commercial use",
            "use in a business for profit",
            "kuh-MUR-shul yoos"
          ],
          [
            "Model card",
            "a model's description page",
            "MOD-ul kard"
          ],
          [
            "Dataset",
            "a collection of data",
            "DAY-tuh-set"
          ]
        ],
        "compare": {
          "title": "Case study: choosing a model for a business",
          "bad": "\"It's popular and free, so let's use it.\" But the card says NC, and a business may not use it for work.",
          "good": "First open the model card and read the licence. Apache-2.0 or MIT: can be considered. NC: only for study and experiments.",
          "why": "Free to download and legal to use in a business are different things. A licence mistake is costly to fix later."
        },
        "practice": "Open the Qwen/Qwen2.5-0.5B-Instruct page on Hugging Face and find the License line on the card. Then open impira/layoutlm-invoices and compare. Write down which one suits business use and why.",
        "prompt": "Explain in plain words how the Apache-2.0, MIT and CC BY-NC-SA 4.0 licences differ for a small company that wants to use an AI model at work. If you are unsure about a condition, say so and suggest where to check.",
        "takeaways": [
          "Read the licence on the model card; do not trust a summary.",
          "Apache-2.0 and MIT allow commercial use; NC forbids it.",
          "A popular, free model is not automatically allowed in a business."
        ],
        "quiz": [
          {
            "q": "May a business use layoutlm-invoices (licence cc-by-nc-sa-4.0) for its work?",
            "o": [
              [
                "No: NC forbids commercial use",
                "Correct. A business is commercial, so this model is for study only."
              ],
              [
                "Yes, since it downloads for free",
                "A free download gives no right to commercial use."
              ],
              [
                "Yes, it has over a million downloads",
                "Popularity does not change the licence."
              ],
              [
                "Yes, if you don't say it is AI",
                "That does not get round the licence, and hiding AI use is wrong."
              ]
            ]
          },
          {
            "q": "Which licences allow commercial use?",
            "o": [
              [
                "Only CC BY-NC-SA 4.0",
                "NC is exactly what forbids commercial use."
              ],
              [
                "No open licences do",
                "Many do, for example Apache-2.0 and MIT."
              ],
              [
                "Any, if the model is on Hugging Face",
                "Hugging Face has models with many different licences."
              ],
              [
                "Apache-2.0 and MIT",
                "Correct. Both allow it as long as you keep the copyright notice."
              ]
            ]
          },
          {
            "q": "Where is the most reliable place to check a model's licence?",
            "o": [
              [
                "In a chatbot's answer",
                "A chatbot can be wrong. Check the primary source."
              ],
              [
                "On the model card on Hugging Face",
                "Correct. That is the primary source: the License line on the card."
              ],
              [
                "By the number of downloads",
                "Downloads say nothing about the licence."
              ],
              [
                "In an advert for the model",
                "An advert does not replace the licence text."
              ]
            ]
          },
          {
            "q": "What is the English for use in a business for profit, and how is it said?",
            "o": [
              [
                "Open source — OH-pun sors",
                "That means source code anyone can read."
              ],
              [
                "Model card — MOD-ul kard",
                "That is a model's description page."
              ],
              [
                "Commercial use — kuh-MUR-shul yoos",
                "Correct. That is what licences with NC forbid."
              ],
              [
                "Dataset — DAY-tuh-set",
                "That is a collection of data."
              ]
            ]
          }
        ]
      }
    },
    {
      "id": "k2l3",
      "minutes": 8,
      "area": "AI Agents",
      "key": [
        1,
        2,
        0,
        3
      ],
      "ru": {
        "title": "Агенты Замбалы: где правила, а где ИИ",
        "situation": "Замбала получила задачу: узнать, какие запросы на слияние открыты в проектах KUBERA. По журналу видна цепочка: координатор дал задачу, исследователь собрал 7 фактов и 2 источника, модель написала ответ за 114 секунд, проверяющий поставил PASS, ответ сохранён в память. Сколько здесь на самом деле ИИ?",
        "points": [
          [
            "Агент",
            "Agent — программа, которая сама выполняет шаги задачи: ищет, вызывает инструменты, сохраняет результат. Агент не обязательно «умный»: часть шагов — обычные правила в коде."
          ],
          [
            "Роли Замбалы",
            "Координатор распределяет задачи, исследователь собирает факты из GitHub и Hugging Face, модель пишет ответ, проверяющий сверяет ответ с источниками, память сохраняет результат."
          ],
          [
            "Правила, а не ИИ",
            "Координатор и проверяющий у Замбалы — правила в программе, а не ИИ. Настоящий вызов ИИ здесь один: модель пишет текст ответа. Важно называть вещи честно: «агент» не значит «всё делает нейросеть»."
          ],
          [
            "Одна модель, очередь задач",
            "Для всех ролей используется одна общая модель, и задачи идут по очереди. Если запустить несколько моделей сразу, слабый компьютер просто остановится."
          ]
        ],
        "terms": [
          [
            "Agent",
            "агент (программа, выполняющая шаги задачи)",
            "э́йджент"
          ],
          [
            "Orchestrator",
            "координатор (распределяет задачи)",
            "о́ркестрэйтер"
          ],
          [
            "Rule-based",
            "на правилах, без ИИ",
            "рул-бэ́йст"
          ],
          [
            "Task queue",
            "очередь задач",
            "таск кью"
          ],
          [
            "Tool call",
            "вызов инструмента",
            "тул кол"
          ]
        ],
        "compare": {
          "title": "Разбор: как описывать агентов",
          "bad": "«У нас 10 ИИ-агентов, каждый думает сам». На деле работают правила и одна модель, и владелец не понимает, где может ошибиться ИИ.",
          "good": "«Координатор и проверяющий — правила в коде. ИИ только пишет текст ответа по собранным фактам». Сразу видно, что проверять.",
          "why": "Если честно разделить правила и ИИ, понятно, какие шаги повторяемы и надёжны, а где возможна выдумка."
        },
        "practice": "Нарисуйте на листе цепочку Замбалы: координатор → исследователь → модель → проверяющий → память. Отметьте зелёным шаги на правилах и красным шаг, где работает ИИ. Подумайте, где в этой цепочке может появиться ошибка.",
        "prompt": "Я описываю систему из нескольких шагов: координатор, исследователь, модель ИИ, проверяющий и память. Помоги разделить, какие шаги лучше делать обычными правилами в коде, а какие требуют ИИ. Объясни, почему.",
        "takeaways": [
          "Агент — это цепочка шагов; ИИ нужен не на каждом шаге.",
          "У Замбалы координатор и проверяющий — правила, а ИИ пишет только текст ответа.",
          "Одна общая модель и очередь задач — так слабый компьютер не перегружается."
        ],
        "quiz": [
          {
            "q": "Сколько настоящих вызовов ИИ в цепочке Замбалы из примера?",
            "o": [
              [
                "Пять: каждый шаг — отдельный ИИ",
                "Нет. Большинство шагов — обычные правила в коде."
              ],
              [
                "Один: модель пишет текст ответа",
                "Верно. Координатор, исследователь, проверяющий и память — программа и правила."
              ],
              [
                "Ни одного",
                "Модель, которая пишет ответ, — это ИИ."
              ],
              [
                "Два: координатор и проверяющий",
                "Как раз они у Замбалы — правила, а не ИИ."
              ]
            ]
          },
          {
            "q": "Почему все роли используют одну общую модель по очереди?",
            "o": [
              [
                "Так требует лицензия модели",
                "Лицензия здесь ни при чём."
              ],
              [
                "Разные модели не говорят по-русски",
                "Дело в ресурсах компьютера, а не в языке."
              ],
              [
                "Несколько моделей сразу перегрузят слабый компьютер",
                "Верно. Одна модель и очередь задач — так компьютер справляется."
              ],
              [
                "Так дороже, но надёжнее",
                "Локальные модели бесплатны; причина — память и процессор."
              ]
            ]
          },
          {
            "q": "Как по-английски «очередь задач» и как произносится?",
            "o": [
              [
                "Task queue — таск кью",
                "Верно. Задачи ждут своей очереди и выполняются по одной."
              ],
              [
                "Tool call — тул кол",
                "Это «вызов инструмента»."
              ],
              [
                "Rule-based — рул-бэ́йст",
                "Это «на правилах»."
              ],
              [
                "Orchestrator — о́ркестрэйтер",
                "Это «координатор»."
              ]
            ]
          },
          {
            "q": "Какое описание системы честное?",
            "o": [
              [
                "«10 ИИ-агентов, каждый думает сам»",
                "Это преувеличение: работают правила и одна модель."
              ],
              [
                "«ИИ всё делает сам, проверять не нужно»",
                "Проверка нужна именно потому, что ИИ может ошибиться."
              ],
              [
                "«Агентов нет, это просто чат»",
                "Агент есть: программа сама выполняет шаги задачи."
              ],
              [
                "«Координатор и проверяющий — правила; ИИ пишет текст ответа»",
                "Верно. Так видно, где возможна ошибка ИИ и что нужно проверять."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "Dzambala's agents: where the rules end and the AI begins",
        "situation": "Dzambala got a task: find which pull requests are open in KUBERA's projects. The log shows the chain: the coordinator assigned the task, the researcher gathered 7 facts and 2 sources, the model wrote an answer in 114 seconds, the verifier gave PASS and the answer was saved to memory. How much of this is really AI?",
        "points": [
          [
            "Agent",
            "An agent is a program that carries out the steps of a task itself: searches, calls tools, saves the result. An agent is not necessarily \"smart\": some steps are ordinary rules in code."
          ],
          [
            "Dzambala's roles",
            "The coordinator assigns tasks, the researcher gathers facts from GitHub and Hugging Face, the model writes the answer, the verifier checks the answer against the sources and memory saves the result."
          ],
          [
            "Rules, not AI",
            "Dzambala's coordinator and verifier are rules in the program, not AI. There is one real AI call here: the model writes the answer text. Name things honestly: \"agent\" does not mean \"a neural network does everything\"."
          ],
          [
            "One model, a task queue",
            "All roles share one model and tasks run one at a time. Starting several models at once would simply stall a weak computer."
          ]
        ],
        "terms": [
          [
            "Agent",
            "a program that carries out a task's steps",
            "AY-junt"
          ],
          [
            "Orchestrator",
            "the coordinator that assigns tasks",
            "OR-kih-stray-tur"
          ],
          [
            "Rule-based",
            "working by fixed rules, without AI",
            "ROOL-bayst"
          ],
          [
            "Task queue",
            "tasks waiting their turn",
            "task kyoo"
          ],
          [
            "Tool call",
            "calling a tool",
            "tool kawl"
          ]
        ],
        "compare": {
          "title": "Case study: how to describe agents",
          "bad": "\"We have 10 AI agents, each thinks for itself.\" In fact rules and one model do the work, and the owner cannot see where the AI might go wrong.",
          "good": "\"The coordinator and verifier are rules in code. The AI only writes the answer text from gathered facts.\" It is clear what to check.",
          "why": "Separating rules from AI honestly shows which steps are repeatable and reliable, and where something might be made up."
        },
        "practice": "Draw Dzambala's chain on paper: coordinator → researcher → model → verifier → memory. Mark the rule-based steps green and the AI step red. Think where in the chain a mistake could appear.",
        "prompt": "I am describing a system with several steps: coordinator, researcher, AI model, verifier and memory. Help me sort which steps are better as ordinary rules in code and which need AI. Explain why.",
        "takeaways": [
          "An agent is a chain of steps; not every step needs AI.",
          "In Dzambala the coordinator and verifier are rules; the AI only writes the answer text.",
          "One shared model and a task queue keep a weak computer from overloading."
        ],
        "quiz": [
          {
            "q": "How many real AI calls are in Dzambala's chain in the example?",
            "o": [
              [
                "Five: each step is a separate AI",
                "No. Most steps are ordinary rules in code."
              ],
              [
                "One: the model writes the answer text",
                "Correct. The coordinator, researcher, verifier and memory are program rules."
              ],
              [
                "None",
                "The model writing the answer is AI."
              ],
              [
                "Two: the coordinator and the verifier",
                "In Dzambala those two are rules, not AI."
              ]
            ]
          },
          {
            "q": "Why do all roles share one model, one task at a time?",
            "o": [
              [
                "The model licence requires it",
                "The licence has nothing to do with it."
              ],
              [
                "Other models do not speak Russian",
                "It is about the computer's resources, not language."
              ],
              [
                "Several models at once would overload a weak computer",
                "Correct. One model and a task queue let the computer cope."
              ],
              [
                "It costs more but is safer",
                "Local models are free; the reason is memory and processor."
              ]
            ]
          },
          {
            "q": "What is the English for tasks waiting their turn, and how is it said?",
            "o": [
              [
                "Task queue — task kyoo",
                "Correct. Tasks wait their turn and run one by one."
              ],
              [
                "Tool call — tool kawl",
                "That is calling a tool."
              ],
              [
                "Rule-based — ROOL-bayst",
                "That means working by fixed rules."
              ],
              [
                "Orchestrator — OR-kih-stray-tur",
                "That is the coordinator."
              ]
            ]
          },
          {
            "q": "Which description of the system is honest?",
            "o": [
              [
                "\"10 AI agents, each thinks for itself\"",
                "An exaggeration: rules and one model do the work."
              ],
              [
                "\"The AI does everything, no checks needed\"",
                "Checks are needed precisely because AI can be wrong."
              ],
              [
                "\"There are no agents, it's just a chat\"",
                "There is an agent: the program carries out the task's steps."
              ],
              [
                "\"The coordinator and verifier are rules; the AI writes the answer text\"",
                "Correct. It shows where an AI mistake is possible and what to check."
              ]
            ]
          }
        ]
      }
    },
    {
      "id": "k2l4",
      "minutes": 8,
      "area": "Verification",
      "key": [
        3,
        0,
        2,
        1
      ],
      "ru": {
        "title": "Проверка фактов и источников",
        "situation": "Замбалу спросили про модели для чтения документов. Модель не ответила, а просто повторила задание своими словами. Проверка всё равно поставила PASS: в повторе не было чисел, которых нет в источниках. Ошибку нашли при контрольной проверке и исправили. Чему учит этот случай?",
        "points": [
          [
            "Правило проверяющего",
            "Проверяющий Замбалы сверяет: каждое число в ответе должно найтись в собранных источниках. Если в ответе есть число, которого нет в источниках, ответ отклоняется: скорее всего, модель его выдумала."
          ],
          [
            "Дыра в проверке",
            "Повтор задания не содержал чисел, поэтому правило его пропустило. После исправления проверка отклоняет и повтор задания, и обрезанный ответ. Повторный запуск прошёл, ответ дал 4 источника со ссылками."
          ],
          [
            "Чего проверка не умеет",
            "Названия и имена проверяющий не сверяет: в одном ответе модель исказила имя автора модели. Поэтому PASS означает «числа сходятся с источниками», а не «всё верно»."
          ],
          [
            "Первоисточник",
            "Факт проверяют по первоисточнику: официальной документации, карточке модели, самой странице на GitHub. Пересказ (в том числе ответ ИИ) — не источник."
          ]
        ],
        "terms": [
          [
            "Verification",
            "проверка",
            "ве́рификейшн"
          ],
          [
            "Source",
            "источник",
            "сорс"
          ],
          [
            "Primary source",
            "первоисточник",
            "пра́ймери сорс"
          ],
          [
            "Citation",
            "ссылка на источник",
            "сайтэ́йшн"
          ],
          [
            "False positive",
            "ложное «всё в порядке»",
            "фолс по́зитив"
          ]
        ],
        "compare": {
          "title": "Разбор: что значит PASS",
          "bad": "«Проверка поставила PASS, значит, ответ верный». А модель повторила вопрос или исказила имя, и проверка этого не увидела.",
          "good": "«PASS: все числа найдены в источниках. Имена не сверялись». Человек знает, что именно проверено и что ещё посмотреть самому.",
          "why": "Любая автоматическая проверка проверяет только то, на что её научили. Честный отчёт называет и это, и пробелы."
        },
        "practice": "Возьмите любой ответ чат-бота с цифрами. Выпишите каждое число и найдите его в источнике, на который ссылается ответ. Если источника нет или числа там нет, отметьте это число как непроверенное.",
        "prompt": "Ответь на мой вопрос и для каждого числа и факта дай ссылку на первоисточник. Если первоисточника нет, отметь факт как «не проверено». Мой вопрос: ...",
        "takeaways": [
          "Каждое число в ответе должно найтись в источнике, иначе его считают выдумкой.",
          "Автоматическая проверка ловит только то, чему её научили; PASS нужно расшифровывать.",
          "Проверяют по первоисточнику, а не по пересказу."
        ],
        "quiz": [
          {
            "q": "Почему проверка сначала пропустила ответ, где модель просто повторила задание?",
            "o": [
              [
                "Модель взломала проверку",
                "Нет, у правила была дыра: оно смотрело только на числа."
              ],
              [
                "Источники были неверные",
                "Источники ни при чём: ответа по существу просто не было."
              ],
              [
                "Проверка была выключена",
                "Проверка работала, но не умела ловить повтор задания."
              ],
              [
                "В повторе не было чисел, а правило проверяло только числа",
                "Верно. После исправления проверка отклоняет и повтор задания, и обрезанный ответ."
              ]
            ]
          },
          {
            "q": "Что означает PASS у проверяющего Замбалы?",
            "o": [
              [
                "Все числа в ответе найдены в источниках",
                "Верно. Имена и названия он не сверяет, поэтому PASS не значит «всё верно»."
              ],
              [
                "Ответ полностью верный",
                "Нет. Например, искажённое имя автора проверка не замечает."
              ],
              [
                "Ответ написал человек",
                "PASS ничего не говорит об авторе ответа."
              ],
              [
                "Ответ короткий",
                "Длина ответа тут ни при чём."
              ]
            ]
          },
          {
            "q": "Как по-английски «первоисточник» и как произносится?",
            "o": [
              [
                "Citation — сайтэ́йшн",
                "Это «ссылка на источник»."
              ],
              [
                "False positive — фолс по́зитив",
                "Это «ложное всё в порядке»."
              ],
              [
                "Primary source — пра́ймери сорс",
                "Верно. Официальная документация, карточка модели, сама страница."
              ],
              [
                "Verification — ве́рификейшн",
                "Это «проверка»."
              ]
            ]
          },
          {
            "q": "Что из этого первоисточник для лицензии модели?",
            "o": [
              [
                "Ответ чат-бота о лицензии",
                "Это пересказ, он может ошибаться."
              ],
              [
                "Карточка модели на Hugging Face",
                "Верно. Это и есть первоисточник."
              ],
              [
                "Пост в соцсети о модели",
                "Пост — пересказ, а не первоисточник."
              ],
              [
                "Число скачиваний",
                "Это вообще не про лицензию."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "Checking facts and sources",
        "situation": "Dzambala was asked about models that read documents. The model did not answer; it just repeated the task in its own words. The check still gave PASS: the repeat had no numbers missing from the sources. The fault was found during an audit and fixed. What does this teach?",
        "points": [
          [
            "The verifier's rule",
            "Dzambala's verifier checks that every number in the answer appears in the gathered sources. If the answer contains a number not in the sources, it is rejected: most likely the model made it up."
          ],
          [
            "A gap in the check",
            "The repeated task had no numbers, so the rule let it through. After the fix the check rejects both a repeated task and a cut-off answer. The rerun passed with 4 linked sources."
          ],
          [
            "What the check cannot do",
            "The verifier does not check names: in one answer the model got a model author's name wrong. So PASS means \"the numbers match the sources\", not \"everything is right\"."
          ],
          [
            "Primary source",
            "Check a fact against the primary source: official documentation, the model card, the GitHub page itself. A retelling, an AI answer included, is not a source."
          ]
        ],
        "terms": [
          [
            "Verification",
            "checking",
            "vair-ih-fih-KAY-shun"
          ],
          [
            "Source",
            "where a fact comes from",
            "sors"
          ],
          [
            "Primary source",
            "the original source",
            "PRY-mair-ee sors"
          ],
          [
            "Citation",
            "a reference to a source",
            "sy-TAY-shun"
          ],
          [
            "False positive",
            "a wrong \"all clear\"",
            "fawls POZ-ih-tiv"
          ]
        ],
        "compare": {
          "title": "Case study: what PASS means",
          "bad": "\"The check said PASS, so the answer is right.\" But the model repeated the question or got a name wrong, and the check did not see it.",
          "good": "\"PASS: all numbers found in the sources. Names not checked.\" The person knows what was checked and what to look at themselves.",
          "why": "Any automatic check checks only what it was built to check. An honest report names both that and the gaps."
        },
        "practice": "Take any chatbot answer with numbers. Write out each number and find it in the source the answer cites. If there is no source, or the number is not there, mark that number as unchecked.",
        "prompt": "Answer my question and for every number and fact give a link to the primary source. If there is no primary source, mark the fact \"not checked\". My question: ...",
        "takeaways": [
          "Every number in an answer must appear in a source; otherwise treat it as made up.",
          "An automatic check catches only what it was built for; spell out what PASS means.",
          "Check against the primary source, not a retelling."
        ],
        "quiz": [
          {
            "q": "Why did the check first pass an answer where the model just repeated the task?",
            "o": [
              [
                "The model hacked the check",
                "No, the rule had a gap: it only looked at numbers."
              ],
              [
                "The sources were wrong",
                "Not the sources: there was simply no real answer."
              ],
              [
                "The check was switched off",
                "It was on, but could not catch a repeated task."
              ],
              [
                "The repeat had no numbers, and the rule only checked numbers",
                "Correct. After the fix the check rejects both a repeated task and a cut-off answer."
              ]
            ]
          },
          {
            "q": "What does PASS from Dzambala's verifier mean?",
            "o": [
              [
                "All numbers in the answer were found in the sources",
                "Correct. It does not check names, so PASS does not mean \"all correct\"."
              ],
              [
                "The answer is completely right",
                "No. A misspelt author name, for example, goes unnoticed."
              ],
              [
                "A person wrote the answer",
                "PASS says nothing about who wrote it."
              ],
              [
                "The answer is short",
                "Length has nothing to do with it."
              ]
            ]
          },
          {
            "q": "What is the English for the original source, and how is it said?",
            "o": [
              [
                "Citation — sy-TAY-shun",
                "That is a reference to a source."
              ],
              [
                "False positive — fawls POZ-ih-tiv",
                "That is a wrong \"all clear\"."
              ],
              [
                "Primary source — PRY-mair-ee sors",
                "Correct. Official documentation, the model card, the page itself."
              ],
              [
                "Verification — vair-ih-fih-KAY-shun",
                "That means checking."
              ]
            ]
          },
          {
            "q": "Which is the primary source for a model's licence?",
            "o": [
              [
                "A chatbot's answer about the licence",
                "That is a retelling and may be wrong."
              ],
              [
                "The model card on Hugging Face",
                "Correct. That is the primary source."
              ],
              [
                "A social media post about the model",
                "A post is a retelling, not the primary source."
              ],
              [
                "The number of downloads",
                "That is not about the licence at all."
              ]
            ]
          }
        ]
      }
    },
    {
      "id": "k2l5",
      "minutes": 7,
      "area": "MCP",
      "key": [
        2,
        1,
        3,
        0
      ],
      "ru": {
        "title": "MCP: как ИИ получает инструменты",
        "situation": "Claude работает в облаке, а файлы и программы Замбалы лежат на Mini PC. Чтобы Claude мог прочитать файл или запустить команду на этом компьютере, на нём работает Desktop Commander. Как устроена такая связь и что ей разрешено?",
        "points": [
          [
            "MCP",
            "Model Context Protocol — по определению его сайта, открытый стандарт для подключения ИИ-приложений к внешним системам. Проще: общий «разъём», через который ИИ получает инструменты — файлы, команды, сервисы."
          ],
          [
            "Сервер и клиент",
            "MCP-сервер даёт инструменты (например, «прочитать файл»), MCP-клиент — ИИ-приложение, которое их вызывает. Desktop Commander — MCP-сервер на Mini PC, Claude — клиент."
          ],
          [
            "Границы доступа",
            "Серверу задают разрешённые папки и инструменты. Всё, что за границей, ИИ не видит. Секретные файлы с кодами при проверке остались на месте, и их никто не открывал."
          ],
          [
            "Что проверено",
            "Desktop Commander работает; автозапуск при входе в Windows создан и не запускает вторую копию, если программа уже работает. Проверка заняла около 1% месячного лимита (83% → 82%). Перезагрузка ещё не проверена."
          ]
        ],
        "terms": [
          [
            "MCP (Model Context Protocol)",
            "протокол подключения ИИ к инструментам",
            "эм-си-пи (мо́дел ко́нтекст про́утокол)"
          ],
          [
            "Server",
            "сервер (даёт инструменты)",
            "сёрвер"
          ],
          [
            "Client",
            "клиент (вызывает инструменты)",
            "кла́йент"
          ],
          [
            "Allowed directories",
            "разрешённые папки",
            "эла́уд дирэ́кторис"
          ],
          [
            "Autostart",
            "автозапуск",
            "о́тостарт"
          ]
        ],
        "compare": {
          "title": "Разбор: сколько доступа давать ИИ",
          "bad": "Открыть ИИ весь компьютер: все папки, все программы, файлы с паролями. Одна ошибка — и пострадают важные данные.",
          "good": "Дать только нужные папки и инструменты. Секретные файлы — вне границ. Каждое действие видно в журнале.",
          "why": "Минимум прав работает и для людей, и для ИИ: чем меньше доступа, тем меньше вреда от ошибки."
        },
        "practice": "Составьте на листе список: какие папки на вашем компьютере ИИ может видеть для работы, а какие — никогда (пароли, личные документы, банковские файлы). Это и есть ваши «разрешённые папки».",
        "prompt": "Объясни простыми словами, что такое MCP (Model Context Protocol) и чем MCP-сервер отличается от MCP-клиента. Приведи пример для маленького офиса и назови главные правила безопасности.",
        "takeaways": [
          "MCP — общий стандарт, через который ИИ получает инструменты.",
          "Сервер даёт инструменты, клиент их вызывает; границы задаёт владелец.",
          "Доступ ИИ к компьютеру — только к нужным папкам; секреты вне границ."
        ],
        "quiz": [
          {
            "q": "Кто в связке Claude и Desktop Commander MCP-сервер?",
            "o": [
              [
                "Claude",
                "Claude вызывает инструменты, значит, он клиент."
              ],
              [
                "Hugging Face",
                "Hugging Face — каталог моделей, он в этой связке не участвует."
              ],
              [
                "Desktop Commander: он даёт инструменты на Mini PC",
                "Верно. Claude — клиент, который эти инструменты вызывает."
              ],
              [
                "Ollama",
                "Ollama запускает модели, а не даёт Claude инструменты."
              ]
            ]
          },
          {
            "q": "Как правильно настроить доступ ИИ к компьютеру?",
            "o": [
              [
                "Весь компьютер, чтобы ИИ ничего не мешало",
                "Так любая ошибка ИИ может задеть важные данные."
              ],
              [
                "Только нужные папки и инструменты, секреты вне границ",
                "Верно. Минимум прав: меньше доступа — меньше вреда от ошибки."
              ],
              [
                "Ничего, но разрешить всё по запросу",
                "Без границ неясно, что ИИ может трогать."
              ],
              [
                "Только файлы с паролями",
                "Как раз пароли должны быть вне границ."
              ]
            ]
          },
          {
            "q": "Как по-английски «разрешённые папки» и как произносится?",
            "o": [
              [
                "Autostart — о́тостарт",
                "Это «автозапуск»."
              ],
              [
                "Client — кла́йент",
                "Это «клиент»."
              ],
              [
                "Server — сёрвер",
                "Это «сервер»."
              ],
              [
                "Allowed directories — эла́уд дирэ́кторис",
                "Верно. Папки, которые MCP-сервер разрешает ИИ."
              ]
            ]
          },
          {
            "q": "Что о Desktop Commander ещё не проверено?",
            "o": [
              [
                "Запуск после перезагрузки Windows",
                "Верно. Автозапуск создан, но перезагрузку пока не делали."
              ],
              [
                "Что он вообще работает",
                "Это проверено."
              ],
              [
                "Что вторая копия не запускается",
                "Это проверено: «already running, not starting a second copy»."
              ],
              [
                "Сколько ушло месячного лимита",
                "Это измерено: около 1%."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "MCP: how AI gets its tools",
        "situation": "Claude runs in the cloud, while Dzambala's files and programs are on the Mini PC. So that Claude can read a file or run a command on that computer, Desktop Commander runs on it. How does this link work, and what is it allowed to do?",
        "points": [
          [
            "MCP",
            "Model Context Protocol is, in its own website's words, an open-source standard for connecting AI applications to external systems. Put simply: a common \"socket\" through which AI gets tools — files, commands, services."
          ],
          [
            "Server and client",
            "An MCP server offers tools (for example \"read a file\"); an MCP client is the AI application that calls them. Desktop Commander is the MCP server on the Mini PC; Claude is the client."
          ],
          [
            "Access limits",
            "The server is given allowed folders and tools. The AI cannot see anything beyond them. During the audit the secret code files stayed where they were and nobody opened them."
          ],
          [
            "What was tested",
            "Desktop Commander works; autostart at Windows sign-in was created and does not start a second copy if one is running. The audit used about 1% of the monthly allowance (83% → 82%). A restart has not been tested yet."
          ]
        ],
        "terms": [
          [
            "MCP (Model Context Protocol)",
            "the standard linking AI to tools",
            "em-see-pee (MOD-ul KON-text PROH-tuh-kol)"
          ],
          [
            "Server",
            "the side that offers tools",
            "SUR-vur"
          ],
          [
            "Client",
            "the side that calls tools",
            "KLY-unt"
          ],
          [
            "Allowed directories",
            "folders the AI may use",
            "uh-LOWD dih-REK-tuh-reez"
          ],
          [
            "Autostart",
            "starting by itself",
            "AW-toh-start"
          ]
        ],
        "compare": {
          "title": "Case study: how much access to give AI",
          "bad": "Open the whole computer to the AI: all folders, all programs, password files. One mistake and important data suffers.",
          "good": "Give only the folders and tools needed. Secret files stay outside the limits. Every action shows in the log.",
          "why": "Least privilege works for people and AI alike: less access means less harm from a mistake."
        },
        "practice": "Make a list on paper: which folders on your computer the AI may see for work, and which never (passwords, personal papers, bank files). Those are your \"allowed directories\".",
        "prompt": "Explain in plain words what MCP (Model Context Protocol) is and how an MCP server differs from an MCP client. Give an example for a small office and name the main safety rules.",
        "takeaways": [
          "MCP is a common standard through which AI gets tools.",
          "The server offers tools, the client calls them; the owner sets the limits.",
          "Give AI access only to the folders it needs; keep secrets outside."
        ],
        "quiz": [
          {
            "q": "In the Claude and Desktop Commander link, which is the MCP server?",
            "o": [
              [
                "Claude",
                "Claude calls the tools, so it is the client."
              ],
              [
                "Hugging Face",
                "Hugging Face is a model catalogue and takes no part in this link."
              ],
              [
                "Desktop Commander: it offers tools on the Mini PC",
                "Correct. Claude is the client that calls those tools."
              ],
              [
                "Ollama",
                "Ollama runs models; it does not give Claude tools."
              ]
            ]
          },
          {
            "q": "What is the right way to set up AI access to a computer?",
            "o": [
              [
                "The whole computer, so nothing gets in the AI's way",
                "Then any AI mistake can hit important data."
              ],
              [
                "Only the folders and tools needed, secrets outside the limits",
                "Correct. Least privilege: less access, less harm from a mistake."
              ],
              [
                "Nothing, but allow everything on request",
                "Without limits it is unclear what the AI may touch."
              ],
              [
                "Only the password files",
                "Passwords are exactly what must stay outside."
              ]
            ]
          },
          {
            "q": "What is the English for folders the AI may use, and how is it said?",
            "o": [
              [
                "Autostart — AW-toh-start",
                "That means starting by itself."
              ],
              [
                "Client — KLY-unt",
                "That is the side that calls tools."
              ],
              [
                "Server — SUR-vur",
                "That is the side that offers tools."
              ],
              [
                "Allowed directories — uh-LOWD dih-REK-tuh-reez",
                "Correct. The folders an MCP server lets the AI use."
              ]
            ]
          },
          {
            "q": "What about Desktop Commander has not been tested yet?",
            "o": [
              [
                "Starting after a Windows restart",
                "Correct. Autostart was created, but no restart has been done yet."
              ],
              [
                "That it works at all",
                "That has been tested."
              ],
              [
                "That a second copy does not start",
                "Tested: \"already running, not starting a second copy\"."
              ],
              [
                "How much of the monthly allowance was used",
                "Measured: about 1%."
              ]
            ]
          }
        ]
      }
    },
    {
      "id": "k2l6",
      "minutes": 7,
      "area": "Automation",
      "key": [
        0,
        2,
        1,
        3
      ],
      "ru": {
        "title": "Автоматизация: задачи по расписанию",
        "situation": "Замбала должна сама проверять новые задачи каждые 2 часа и раз в неделю готовить отчёт. Для этого в Планировщике заданий Windows созданы две задачи: «каждые 2 часа» с первым запуском в 14:30 и «еженедельный отчёт» по понедельникам в 09:00. Когда можно сказать, что автоматизация работает?",
        "points": [
          [
            "Планировщик заданий",
            "Task Scheduler — встроенная в Windows программа, которая запускает задачи по времени или по событию, например при входе пользователя. Бесплатно и без дополнительных программ."
          ],
          [
            "Триггер",
            "Trigger — условие запуска: время, повтор каждые 2 часа, вход в Windows, включение компьютера. У одной задачи может быть несколько триггеров; она запускается, когда срабатывает любой из них."
          ],
          [
            "Вход в систему",
            "Задачи Замбалы сейчас работают, только пока вы вошли в Windows. В Планировщике это настройка «Выполнять только для вошедшего пользователя». Если выйти из Windows, расписание остановится."
          ],
          [
            "Создано или проверено",
            "Задачи созданы — это PASS. Первый автоматический запуск в 14:30 на момент урока ещё не прошёл — это NOT TESTED. Автоматизацию считают работающей только после первого реального запуска по расписанию."
          ]
        ],
        "terms": [
          [
            "Task Scheduler",
            "Планировщик заданий Windows",
            "таск шэ́джулер"
          ],
          [
            "Scheduled task",
            "задача по расписанию",
            "шэ́джулд таск"
          ],
          [
            "Trigger",
            "условие запуска",
            "три́ггер"
          ],
          [
            "Log on",
            "вход в систему",
            "лог он"
          ],
          [
            "Log file",
            "журнал работы",
            "лог файл"
          ]
        ],
        "compare": {
          "title": "Разбор: «настроено» и «работает»",
          "bad": "«Расписание создано, значит, всё работает». А первый запуск не прошёл, потому что компьютер был выключен или пользователь вышел из Windows.",
          "good": "«Задачи созданы (PASS). Первый запуск в 14:30 проверю по журналу (NOT TESTED)». После запуска — проверить журнал и результат.",
          "why": "Настройка — это обещание. Доказательство — журнал первого реального запуска."
        },
        "practice": "Откройте на своём компьютере Планировщик заданий Windows (Пуск → «Планировщик заданий»). Найдите любую задачу и посмотрите вкладки «Триггеры» и «Журнал». Ничего не меняйте, только смотрите.",
        "prompt": "Объясни простыми словами, как работает Планировщик заданий Windows: что такое задача, триггер и действие. Чем отличается настройка «только для вошедшего пользователя» от запуска без входа?",
        "takeaways": [
          "Планировщик заданий Windows запускает задачи сам, бесплатно.",
          "Задачи Замбалы сейчас работают, только пока вы вошли в Windows.",
          "«Создано» — ещё не «работает»: нужен журнал первого реального запуска."
        ],
        "quiz": [
          {
            "q": "Расписание создано, первый запуск в 14:30 ещё не прошёл. Какой статус честный?",
            "o": [
              [
                "Создано — PASS; первый запуск — NOT TESTED",
                "Верно. Работающим расписание назовём после первого реального запуска."
              ],
              [
                "Всё PASS",
                "Первый запуск ещё не прошёл, его нельзя считать проверенным."
              ],
              [
                "Всё FAIL",
                "Ошибки нет: просто время запуска ещё не наступило."
              ],
              [
                "Работает на 90%",
                "Проценты готовности не используем: только PASS, FAIL, NOT TESTED."
              ]
            ]
          },
          {
            "q": "Что будет с задачами Замбалы, если выйти из Windows?",
            "o": [
              [
                "Ничего, они работают всегда",
                "Сейчас — только пока вы вошли в Windows."
              ],
              [
                "Они запустятся в облаке",
                "Задачи Планировщика работают на этом компьютере, а не в облаке."
              ],
              [
                "Они не запустятся: они настроены только для вошедшего пользователя",
                "Верно. Пока это ограничение, о нём нужно помнить."
              ],
              [
                "Они удалятся",
                "Задачи не удаляются, просто не запускаются."
              ]
            ]
          },
          {
            "q": "Как по-английски «условие запуска» и как произносится?",
            "o": [
              [
                "Log file — лог файл",
                "Это «журнал работы»."
              ],
              [
                "Trigger — три́ггер",
                "Верно. Например, время, повтор каждые 2 часа или вход в Windows."
              ],
              [
                "Task Scheduler — таск шэ́джулер",
                "Это сам Планировщик заданий."
              ],
              [
                "Log on — лог он",
                "Это «вход в систему»."
              ]
            ]
          },
          {
            "q": "Чем доказать, что автоматизация действительно работает?",
            "o": [
              [
                "Скриншотом настроек",
                "Настройки показывают план, но не результат."
              ],
              [
                "Словами «я всё настроил»",
                "Слова не заменяют журнал."
              ],
              [
                "Тем, что ошибок не было видно",
                "Отсутствие ошибок ещё не значит, что задача запускалась."
              ],
              [
                "Журналом первого реального запуска по расписанию",
                "Верно. Журнал и результат запуска — доказательство, а настройка — только обещание."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "Automation: scheduled tasks",
        "situation": "Dzambala must check for new tasks every 2 hours and prepare a report once a week by itself. For this, two tasks were created in Windows Task Scheduler: \"every 2 hours\", first run at 14:30, and \"weekly report\" on Mondays at 09:00. When can we say the automation works?",
        "points": [
          [
            "Task Scheduler",
            "Task Scheduler is a Windows program that starts tasks at a time or on an event, for example when a user signs in. Free, nothing extra to install."
          ],
          [
            "Trigger",
            "A trigger is what starts a task: a time, a repeat every 2 hours, signing in to Windows, the computer starting. A task can have several triggers and runs when any of them fires."
          ],
          [
            "Signing in",
            "Dzambala's tasks currently run only while you are signed in to Windows. In Task Scheduler this is \"Run only when user is logged on\". If you sign out, the schedule stops."
          ],
          [
            "Created or tested",
            "The tasks are created: PASS. The first automatic run at 14:30 had not happened when this lesson was written: NOT TESTED. Automation counts as working only after its first real scheduled run."
          ]
        ],
        "terms": [
          [
            "Task Scheduler",
            "the Windows scheduling program",
            "task SKEJ-oo-lur"
          ],
          [
            "Scheduled task",
            "a task that runs on a timetable",
            "SKEJ-oold task"
          ],
          [
            "Trigger",
            "what starts a task",
            "TRIG-ur"
          ],
          [
            "Log on",
            "signing in",
            "log on"
          ],
          [
            "Log file",
            "a record of what ran",
            "log file"
          ]
        ],
        "compare": {
          "title": "Case study: \"set up\" and \"working\"",
          "bad": "\"The schedule is created, so it all works.\" But the first run did not happen because the computer was off or the user signed out.",
          "good": "\"Tasks created (PASS). I'll check the 14:30 run in the log (NOT TESTED).\" After the run, check the log and the result.",
          "why": "A setting is a promise. The proof is the log of the first real run."
        },
        "practice": "Open Windows Task Scheduler on your computer (Start → \"Task Scheduler\"). Find any task and look at its Triggers and History tabs. Change nothing, just look.",
        "prompt": "Explain in plain words how Windows Task Scheduler works: what a task, a trigger and an action are. How does \"Run only when user is logged on\" differ from running without signing in?",
        "takeaways": [
          "Windows Task Scheduler starts tasks by itself, for free.",
          "Dzambala's tasks currently run only while you are signed in to Windows.",
          "\"Created\" is not yet \"working\": you need the log of the first real run."
        ],
        "quiz": [
          {
            "q": "The schedule is created; the first run at 14:30 has not happened yet. Which status is honest?",
            "o": [
              [
                "Created — PASS; first run — NOT TESTED",
                "Correct. We call the schedule working after its first real run."
              ],
              [
                "All PASS",
                "The first run has not happened, so it cannot count as tested."
              ],
              [
                "All FAIL",
                "There is no error: the run time simply has not come yet."
              ],
              [
                "90% working",
                "We do not use readiness percentages: only PASS, FAIL, NOT TESTED."
              ]
            ]
          },
          {
            "q": "What happens to Dzambala's tasks if you sign out of Windows?",
            "o": [
              [
                "Nothing, they always run",
                "For now, only while you are signed in."
              ],
              [
                "They run in the cloud",
                "Task Scheduler tasks run on this computer, not in the cloud."
              ],
              [
                "They will not run: they are set to run only for the signed-in user",
                "Correct. While this limit stands, keep it in mind."
              ],
              [
                "They get deleted",
                "They are not deleted; they just do not run."
              ]
            ]
          },
          {
            "q": "What is the English for what starts a task, and how is it said?",
            "o": [
              [
                "Log file — log file",
                "That is a record of what ran."
              ],
              [
                "Trigger — TRIG-ur",
                "Correct. For example a time, a repeat every 2 hours or signing in."
              ],
              [
                "Task Scheduler — task SKEJ-oo-lur",
                "That is the scheduling program itself."
              ],
              [
                "Log on — log on",
                "That means signing in."
              ]
            ]
          },
          {
            "q": "What proves the automation really works?",
            "o": [
              [
                "A screenshot of the settings",
                "Settings show the plan, not the result."
              ],
              [
                "Saying \"I set it all up\"",
                "Words do not replace the log."
              ],
              [
                "No errors were visible",
                "No visible errors does not mean the task ran."
              ],
              [
                "The log of its first real scheduled run",
                "Correct. The log and the result are proof; the setting is only a promise."
              ]
            ]
          }
        ]
      }
    },
    {
      "id": "k2l7",
      "minutes": 8,
      "area": "Agent Memory",
      "key": [
        1,
        3,
        0,
        2
      ],
      "ru": {
        "title": "Память агента и передача задач",
        "situation": "Замбалу остановили и запустили заново. На вопрос о прошлой работе она ответила: «В памяти задач: 3. Последняя: … Проверка: PASS». А сложную задачу ей передали через GitHub: в 12:42 она написала «задача получена», в 12:46 — результат с источниками. Как устроены память и передача задач?",
        "points": [
          [
            "Постоянная память",
            "Persistent memory — память, которая переживает перезапуск. Модель сама ничего не помнит между запусками; помнит программа, которая сохраняет задачи и результаты на диск. У Замбалы сейчас это файлы; база SQLite — следующий шаг, ещё не сделан."
          ],
          [
            "Что проверено",
            "Память пережила остановку модели и перезапуск программы — PASS. Перезагрузку всего Windows ещё не делали — NOT TESTED."
          ],
          [
            "Очередь задач в GitHub",
            "Задачу для Замбалы создают в GitHub с заголовком, который начинается с [DZAMBALA]. Она проверяет такие задачи по расписанию, пишет комментарий «задача получена», выполняет подзадачи и пишет результат с источниками."
          ],
          [
            "Подтверждение",
            "Задача считается переданной только после ответа «задача получена». До этого нельзя говорить, что помощник её получил: письмо или задача могли не дойти."
          ]
        ],
        "terms": [
          [
            "Persistent memory",
            "постоянная память",
            "перси́стент мэ́мори"
          ],
          [
            "Database",
            "база данных",
            "дэ́йтабейс"
          ],
          [
            "Handoff",
            "передача задачи",
            "хэ́ндоф"
          ],
          [
            "Acknowledgement",
            "подтверждение получения",
            "экно́леджмент"
          ],
          [
            "Issue",
            "задача в GitHub",
            "и́шью"
          ]
        ],
        "compare": {
          "title": "Разбор: «отправил» и «получено»",
          "bad": "«Я отправил задачу Замбале, она её делает». А задача ещё не прочитана: расписание не запускалось или произошла ошибка.",
          "good": "«Задача создана в 12:33. Замбала подтвердила получение в 12:42 и дала результат в 12:46». Каждый шаг виден в GitHub.",
          "why": "Подтверждение превращает надежду в факт. Без него никто не знает, дошла ли задача."
        },
        "practice": "Подумайте о своей работе: где вы считаете задачу переданной, не получив подтверждения (письмо подрядчику, сообщение сотруднику)? Запишите один такой случай и как можно попросить подтверждение.",
        "prompt": "Объясни простыми словами, почему модель ИИ сама не помнит прошлые разговоры, и как программа может дать ей постоянную память. Чем хранение в файлах отличается от базы данных SQLite?",
        "takeaways": [
          "Помнит не модель, а программа, которая сохраняет задачи на диск.",
          "Память Замбалы пережила перезапуск программы; перезагрузка Windows ещё не проверена.",
          "Задача передана только после подтверждения «задача получена»."
        ],
        "quiz": [
          {
            "q": "Кто на самом деле «помнит» прошлые задачи Замбалы?",
            "o": [
              [
                "Сама модель ИИ",
                "Модель между запусками ничего не хранит."
              ],
              [
                "Программа, которая сохраняет задачи и результаты на диск",
                "Верно. Модель между запусками ничего не помнит."
              ],
              [
                "Облако Cloudflare",
                "Память Замбалы лежит на диске Mini PC."
              ],
              [
                "Hugging Face",
                "Hugging Face — каталог моделей, не память Замбалы."
              ]
            ]
          },
          {
            "q": "Когда задачу для Замбалы можно считать переданной?",
            "o": [
              [
                "Сразу после создания задачи",
                "Создать — ещё не значит, что её прочитали."
              ],
              [
                "Когда прошло 2 часа",
                "Время ничего не доказывает: запуск мог не произойти."
              ],
              [
                "Когда кто-то сказал «я отправил»",
                "Слова отправителя не подтверждают получение."
              ],
              [
                "Когда в GitHub появился комментарий «задача получена»",
                "Верно. До подтверждения нельзя говорить, что помощник получил задачу."
              ]
            ]
          },
          {
            "q": "Как по-английски «передача задачи» и как произносится?",
            "o": [
              [
                "Handoff — хэ́ндоф",
                "Верно. Передача задачи от одного исполнителя другому."
              ],
              [
                "Acknowledgement — экно́леджмент",
                "Это «подтверждение получения»."
              ],
              [
                "Database — дэ́йтабейс",
                "Это «база данных»."
              ],
              [
                "Persistent memory — перси́стент мэ́мори",
                "Это «постоянная память»."
              ]
            ]
          },
          {
            "q": "Что о памяти Замбалы ещё не сделано или не проверено?",
            "o": [
              [
                "Сохранение после перезапуска программы",
                "Это проверено: «В памяти задач: 3»."
              ],
              [
                "Что память вообще есть",
                "Память есть, она хранится в файлах."
              ],
              [
                "Перезагрузка Windows и переход на базу SQLite",
                "Верно. Перезапуск программы проверен, а это — следующие шаги."
              ],
              [
                "Ответ «задача получена» в GitHub",
                "Это проверено: 12:42 получено, 12:46 результат."
              ]
            ]
          }
        ]
      },
      "en": {
        "title": "Agent memory and handing over tasks",
        "situation": "Dzambala was stopped and started again. Asked about past work, it answered: \"Tasks in memory: 3. Last: … Check: PASS\". A harder task was handed to it through GitHub: at 12:42 it wrote \"task received\", at 12:46 the result with sources. How do memory and handing over tasks work?",
        "points": [
          [
            "Persistent memory",
            "Persistent memory survives a restart. The model itself remembers nothing between runs; the program remembers by saving tasks and results to disk. Dzambala uses files for now; an SQLite database is the next step and is not done yet."
          ],
          [
            "What was tested",
            "Memory survived the model being unloaded and the program restarting: PASS. A full Windows restart has not been done yet: NOT TESTED."
          ],
          [
            "A task queue in GitHub",
            "A task for Dzambala is created in GitHub with a title starting [DZAMBALA]. It checks for such tasks on schedule, comments \"task received\", carries out the subtasks and writes the result with sources."
          ],
          [
            "Acknowledgement",
            "A task counts as handed over only after the \"task received\" reply. Until then, do not say the assistant has it: the message or task may not have arrived."
          ]
        ],
        "terms": [
          [
            "Persistent memory",
            "memory that survives a restart",
            "pur-SIS-tunt MEM-uh-ree"
          ],
          [
            "Database",
            "an organised store of data",
            "DAY-tuh-bays"
          ],
          [
            "Handoff",
            "passing a task on",
            "HAND-off"
          ],
          [
            "Acknowledgement",
            "confirming something was received",
            "ak-NOL-ij-munt"
          ],
          [
            "Issue",
            "a task in GitHub",
            "ISH-oo"
          ]
        ],
        "compare": {
          "title": "Case study: \"sent\" and \"received\"",
          "bad": "\"I sent Dzambala the task, it's working on it.\" But the task has not been read: the schedule did not run or something failed.",
          "good": "\"Task created at 12:33. Dzambala confirmed receipt at 12:42 and gave the result at 12:46.\" Every step is visible in GitHub.",
          "why": "An acknowledgement turns hope into fact. Without it nobody knows whether the task arrived."
        },
        "practice": "Think about your work: where do you count a task as handed over without confirmation (an email to a contractor, a message to an employee)? Write down one case and how you could ask for confirmation.",
        "prompt": "Explain in plain words why an AI model does not remember past conversations by itself, and how a program can give it persistent memory. How does storing in files differ from an SQLite database?",
        "takeaways": [
          "The program remembers, not the model: it saves tasks to disk.",
          "Dzambala's memory survived a program restart; a Windows restart is not tested yet.",
          "A task is handed over only after \"task received\"."
        ],
        "quiz": [
          {
            "q": "Who really \"remembers\" Dzambala's past tasks?",
            "o": [
              [
                "The AI model itself",
                "The model stores nothing between runs."
              ],
              [
                "The program that saves tasks and results to disk",
                "Correct. The model remembers nothing between runs."
              ],
              [
                "The Cloudflare cloud",
                "Dzambala's memory is on the Mini PC's disk."
              ],
              [
                "Hugging Face",
                "Hugging Face is a model catalogue, not Dzambala's memory."
              ]
            ]
          },
          {
            "q": "When does a task for Dzambala count as handed over?",
            "o": [
              [
                "Right after the task is created",
                "Created does not mean read."
              ],
              [
                "After 2 hours have passed",
                "Time proves nothing: the run may not have happened."
              ],
              [
                "When someone says \"I sent it\"",
                "The sender's words do not confirm receipt."
              ],
              [
                "When a \"task received\" comment appears in GitHub",
                "Correct. Until then, do not say the assistant has the task."
              ]
            ]
          },
          {
            "q": "What is the English for passing a task on, and how is it said?",
            "o": [
              [
                "Handoff — HAND-off",
                "Correct. Passing a task from one worker to another."
              ],
              [
                "Acknowledgement — ak-NOL-ij-munt",
                "That is confirming receipt."
              ],
              [
                "Database — DAY-tuh-bays",
                "That is an organised store of data."
              ],
              [
                "Persistent memory — pur-SIS-tunt MEM-uh-ree",
                "That is memory that survives a restart."
              ]
            ]
          },
          {
            "q": "What about Dzambala's memory is not done or not tested yet?",
            "o": [
              [
                "Keeping memory after a program restart",
                "Tested: \"Tasks in memory: 3\"."
              ],
              [
                "That there is any memory at all",
                "There is memory, stored in files."
              ],
              [
                "A Windows restart and moving to an SQLite database",
                "Correct. A program restart is tested; these are the next steps."
              ],
              [
                "The \"task received\" reply in GitHub",
                "Tested: received at 12:42, result at 12:46."
              ]
            ]
          }
        ]
      }
    }
  ]
};

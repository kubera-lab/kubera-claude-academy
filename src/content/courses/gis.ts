import type { Course } from '../types.ts';
import { SRC } from '../sources.ts';

const l = (en: string, ru: string) => ({ en, ru });

const HAV = `function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}`;

const NEAREST = `function nearest(points, lat, lon, maxKm) {
  const R = 6371;
  const rad = (x) => (x * Math.PI) / 180;
  const d = (a, b, c, e) => {
    const s = Math.sin(rad(c - a) / 2) ** 2 + Math.cos(rad(a)) * Math.cos(rad(c)) * Math.sin(rad(e - b) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  };
  let best = null;
  let bestD = Infinity;
  for (const p of points) {
    if (typeof p.lat !== 'number' || typeof p.lon !== 'number') continue;
    const k = d(lat, lon, p.lat, p.lon);
    if (k < bestD) { bestD = k; best = p.id; }
  }
  return bestD <= maxKm ? best : null;
}`;

const PTS = [
  { id: 'mitcham-library', lat: 51.4033, lon: -0.168 },
  { id: 'morden-hall', lat: 51.4021, lon: -0.1945 },
  { id: 'westminster', lat: 51.5007, lon: -0.1246 },
];

export const GIS: Course = {
  id: 'gis',
  n: 7,
  title: l('GIS and Official Open Data', 'ГИС и официальные открытые данные'),
  level: l('Intermediate', 'Средний'),
  summary: l('Coordinates, distances, UK property identifiers and the quality of location data.', 'Координаты, расстояния, британские идентификаторы объектов и качество геоданных.'),
  outcome: l('Tested functions that measure distance and find the nearest place, with bad coordinates handled.', 'Проверенные функции для расстояний и поиска ближайшей точки с обработкой ошибочных координат.'),
  lessons: [
    {
      id: 'gis-1', v: 1, minutes: 15,
      title: l('Latitude, longitude and common mistakes', 'Широта, долгота и типичные ошибки'),
      explain: [
        l('GPS and most web maps use WGS84 latitude and longitude in degrees. Latitude runs from −90 to 90 (south to north), longitude from −180 to 180 (west to east). Great Britain lies roughly between latitude 49.9 and 60.9 and longitude −8.7 and 1.8.', 'GPS и большинство веб-карт используют широту и долготу WGS84 в градусах. Широта — от −90 до 90 (с юга на север), долгота — от −180 до 180 (с запада на восток). Великобритания примерно между широтами 49,9 и 60,9 и долготами −8,7 и 1,8.'),
        l('Ordnance Survey data often uses the British National Grid instead: eastings and northings in metres. Mixing the two systems, swapping latitude and longitude, or using 0,0 for "unknown" are the most common location data errors.', 'Данные Ordnance Survey часто используют Британскую национальную сетку: восточные и северные координаты в метрах. Смешивание систем, перестановка широты и долготы или 0,0 вместо «неизвестно» — самые частые ошибки в геоданных.'),
      ],
      example: l('Westminster: latitude 51.5007, longitude −0.1246. Written as (−0.1246, 51.5007) the values are swapped and the point lands near the equator in the Indian Ocean, not in London.', 'Вестминстер: широта 51,5007, долгота −0,1246. Если записать (−0,1246, 51,5007) — координаты переставлены, и точка окажется у экватора в Индийском океане, а не в Лондоне.'),
      sources: [SRC.osCoords],
      exercise: {
        kind: 'classify',
        intro: l('Each record claims to be a London address. Classify its (latitude, longitude).', 'Каждая запись якобы — адрес в Лондоне. Классифицируйте её (широта, долгота).'),
        labels: [
          { id: 'ok', label: l('Plausible', 'Правдоподобно') },
          { id: 'swapped', label: l('Lat/lon swapped', 'Широта и долгота переставлены') },
          { id: 'placeholder', label: l('Placeholder 0,0', 'Заглушка 0,0') },
          { id: 'outside', label: l('Outside Great Britain', 'За пределами Великобритании') },
        ],
        items: [
          { id: 'c1', text: l('(51.4033, −0.1680)', '(51.4033, −0.1680)'), correct: 'ok', why: l('South London.', 'Юг Лондона.') },
          { id: 'c2', text: l('(−0.1680, 51.4033)', '(−0.1680, 51.4033)'), correct: 'swapped', why: l('A London longitude in the latitude field.', 'Лондонская долгота в поле широты.') },
          { id: 'c3', text: l('(0, 0)', '(0, 0)'), correct: 'placeholder', why: l('"Null Island": a classic missing-value placeholder.', '«Нулевой остров»: классическая заглушка вместо пропуска.') },
          { id: 'c4', text: l('(48.8566, 2.3522)', '(48.8566, 2.3522)'), correct: 'outside', why: l('That is Paris.', 'Это Париж.') },
          { id: 'c5', text: l('(51.5007, −0.1246)', '(51.5007, −0.1246)'), correct: 'ok', why: l('Westminster.', 'Вестминстер.') },
        ],
      },
    },
    {
      id: 'gis-2', v: 1, minutes: 25,
      title: l('Distance between two points', 'Расстояние между двумя точками'),
      explain: [
        l('On a sphere, the shortest distance between two points follows a great circle. The haversine formula computes it from two latitude/longitude pairs. Using the Earth\'s mean radius of 6371 km gives an approximation that is accurate enough for "how far is the nearest library" (errors well under 1%).', 'На сфере кратчайшее расстояние между точками идёт по дуге большого круга. Формула гаверсинусов вычисляет его по двум парам широта/долгота. Со средним радиусом Земли 6371 км получается приближение, достаточно точное для задач вроде «как далеко ближайшая библиотека» (ошибка значительно меньше 1%).'),
        l('JavaScript\'s Math functions work in radians: convert degrees with × π / 180 first. Forgetting this is the most common bug.', 'Функции Math в JavaScript работают в радианах: сначала переведите градусы умножением на π / 180. Забыть об этом — самая частая ошибка.'),
      ],
      example: l('a = sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlon/2)\nd = 2 · 6371 · asin(√a)', 'a = sin²(Δшир/2) + cos(шир1)·cos(шир2)·sin²(Δдолг/2)\nd = 2 · 6371 · asin(√a)'),
      sources: [SRC.osCoords, SRC.mdnFunctions],
      exercise: {
        kind: 'code',
        task: l('Write distanceKm(lat1, lon1, lat2, lon2) using the haversine formula and R = 6371 km. Tests allow ±0.01 km.', 'Напишите distanceKm(lat1, lon1, lat2, lon2) по формуле гаверсинусов с R = 6371 км. Допуск в тестах ±0,01 км.'),
        fnName: 'distanceKm',
        starter: 'function distanceKm(lat1, lon1, lat2, lon2) {\n  const R = 6371;\n  return 0;\n}',
        reference: HAV,
        hint: l('Convert every degree value to radians before Math.sin / Math.cos.', 'Переведите каждое значение в градусах в радианы перед Math.sin / Math.cos.'),
        tests: [
          { id: 'd1', label: l('Westminster → Mitcham ≈ 11.24 km', 'Вестминстер → Митчем ≈ 11,24 км'), args: [51.5007, -0.1246, 51.4033, -0.168], expect: 11.2402, tol: 0.01 },
          { id: 'd2', label: l('Mitcham → Morden Hall ≈ 1.84 km', 'Митчем → Морден-Холл ≈ 1,84 км'), args: [51.4033, -0.168, 51.4021, -0.1945], expect: 1.8431, tol: 0.01 },
          { id: 'h1', label: l('hidden: same point = 0', 'скрытый: та же точка = 0'), args: [51.4, -0.17, 51.4, -0.17], expect: 0, tol: 0.0001, hidden: true },
          { id: 'h2', label: l('hidden: Edinburgh → Westminster ≈ 534.43 km', 'скрытый: Эдинбург → Вестминстер ≈ 534,43 км'), args: [55.9533, -3.1883, 51.5007, -0.1246], expect: 534.4272, tol: 0.01, hidden: true },
          { id: 'h3', label: l('hidden: order does not matter', 'скрытый: порядок точек не важен'), args: [51.4021, -0.1945, 51.4033, -0.168], expect: 1.8431, tol: 0.01, hidden: true },
        ],
      },
    },
    {
      id: 'gis-3', v: 1, minutes: 15,
      title: l('UK open property data: UPRN and EPC', 'Открытые данные Великобритании: UPRN и EPC'),
      explain: [
        l('A UPRN (Unique Property Reference Number) identifies an addressable location in Great Britain. Ordnance Survey publishes OS Open UPRN, an open dataset that links each UPRN to coordinates. Addresses change spelling; a UPRN stays the same, so it is the best key for joining datasets.', 'UPRN (уникальный номер объекта недвижимости) обозначает адресуемое место в Великобритании. Ordnance Survey публикует OS Open UPRN — открытый набор, связывающий каждый UPRN с координатами. Написание адресов меняется, UPRN — нет, поэтому это лучший ключ для соединения наборов данных.'),
        l('Energy Performance Certificate (EPC) data for England and Wales is published by the government under the Open Government Licence v3.0, "except where otherwise stated". Always read the licence page of each dataset and record it in your provenance notes.', 'Данные энергосертификатов (EPC) по Англии и Уэльсу публикует правительство по Open Government Licence v3.0 «если не указано иное». Всегда читайте страницу лицензии каждого набора и записывайте её в заметки о происхождении данных.'),
      ],
      example: l('Joining sales to EPC records on UPRN instead of on address text avoids "Flat 3" vs "3" vs "Apartment 3" mismatches.', 'Соединение продаж с EPC по UPRN, а не по тексту адреса, избавляет от несовпадений «Flat 3», «3» и «Apartment 3».'),
      sources: [SRC.osUPRN, SRC.epcData, SRC.osCoords],
      exercise: {
        kind: 'choice',
        questions: [
          { id: 'g3q1', prompt: l('Why is UPRN a better join key than the address text?', 'Почему UPRN лучше текста адреса как ключ соединения?'), options: [l('It stays the same when spelling varies', 'Он не меняется, когда меняется написание'), l('It is shorter', 'Он короче'), l('It contains the price', 'В нём есть цена')], correct: 0, why: l('Stable identifiers avoid spelling mismatches.', 'Стабильные идентификаторы избавляют от несовпадений написания.') },
          { id: 'g3q2', prompt: l('Where do you confirm the licence of a dataset?', 'Где подтвердить лицензию набора данных?'), options: [l('On the publisher\'s licence page for that dataset', 'На странице лицензии этого набора у издателя'), l('In a forum post', 'В посте на форуме'), l('Assume all government data is free for anything', 'Считать, что все государственные данные можно использовать как угодно')], correct: 0, why: l('"Except where otherwise stated" means you must check.', '«Если не указано иное» значит, что нужно проверять.') },
          { id: 'g3q3', prompt: l('A record has a UPRN but its coordinates are (0, 0). Best action?', 'У записи есть UPRN, но координаты (0, 0). Что лучше сделать?'), options: [l('Look up coordinates for that UPRN in OS Open UPRN and log the fix', 'Найти координаты этого UPRN в OS Open UPRN и записать исправление'), l('Keep 0,0', 'Оставить 0,0'), l('Delete the record', 'Удалить запись')], correct: 0, why: l('Repair from an authoritative source and record provenance.', 'Исправить по авторитетному источнику и записать происхождение.') },
        ],
      },
    },
    {
      id: 'gis-4', v: 1, minutes: 35, lab: true,
      title: l('Lab: find the nearest place', 'Лаборатория: поиск ближайшего места'),
      explain: [
        l('Write nearest(points, lat, lon, maxKm). Each point is { id, lat, lon }. Return the id of the closest point if it is within maxKm, otherwise null. Skip points whose lat or lon is not a number — real data has gaps.', 'Напишите nearest(points, lat, lon, maxKm). Каждая точка — { id, lat, lon }. Верните id ближайшей точки, если она не дальше maxKm, иначе null. Пропускайте точки, у которых lat или lon — не число: в реальных данных бывают пропуски.'),
        l('Your function runs for real in your browser against visible and hidden tests, including empty lists and broken records.', 'Функция реально выполняется в браузере на видимых и скрытых тестах, включая пустые списки и испорченные записи.'),
      ],
      example: l('nearest([{id:"a",lat:51.40,lon:-0.17}], 51.40, -0.17, 1) → "a"', 'nearest([{id:"a",lat:51.40,lon:-0.17}], 51.40, -0.17, 1) → "a"'),
      sources: [SRC.osCoords, SRC.osUPRN, SRC.mdnFunctions],
      exercise: {
        kind: 'code',
        task: l('Implement nearest(points, lat, lon, maxKm). Use the haversine distance from the previous lesson.', 'Реализуйте nearest(points, lat, lon, maxKm). Используйте формулу гаверсинусов из прошлого урока.'),
        fnName: 'nearest',
        starter: 'function nearest(points, lat, lon, maxKm) {\n  return null;\n}',
        reference: NEAREST,
        hint: l('Keep the best distance so far; start with Infinity. Compare with maxKm at the end.', 'Храните лучшее расстояние; начните с Infinity. В конце сравните с maxKm.'),
        tests: [
          { id: 'n1', label: l('from Mitcham → mitcham-library', 'из Митчема → mitcham-library'), args: [PTS, 51.404, -0.17, 5], expect: 'mitcham-library' },
          { id: 'n2', label: l('near Morden Hall → morden-hall', 'у Морден-Холла → morden-hall'), args: [PTS, 51.401, -0.19, 5], expect: 'morden-hall' },
          { id: 'n3', label: l('too far → null', 'слишком далеко → null'), args: [PTS, 55.95, -3.19, 10], expect: null },
          { id: 'h1', label: l('hidden: empty list → null', 'скрытый: пустой список → null'), args: [[], 51.4, -0.17, 10], expect: null, hidden: true },
          { id: 'h2', label: l('hidden: skip broken record', 'скрытый: пропуск испорченной записи'), args: [[{ id: 'bad', lat: null, lon: -0.17 }, ...PTS], 51.4, -0.17, 5], expect: 'mitcham-library', hidden: true },
          { id: 'h3', label: l('hidden: exactly on a point', 'скрытый: ровно в точке'), args: [PTS, 51.5007, -0.1246, 0.5], expect: 'westminster', hidden: true },
        ],
      },
    },
  ],
};

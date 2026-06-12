function formatSeriesTimestamp(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+09:00`
}

function createSeededRandom(seed) {
  let state = seed % 2147483647
  if (state <= 0) state += 2147483646

  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function buildHourlySeries({
  startAt,
  endAt,
  seed,
  min,
  max,
  digits = 1,
}) {
  const random = createSeededRandom(seed)
  const current = new Date(startAt)
  const end = new Date(endAt)
  const values = []
  const timestamps = []
  const serverTimestamps = []

  while (current.getTime() <= end.getTime()) {
    const value = Number((min + random() * (max - min)).toFixed(digits))
    const timestamp = formatSeriesTimestamp(current)
    const serverTimestampDate = new Date(current.getTime() + 5000)

    values.push(value)
    timestamps.push(timestamp)
    serverTimestamps.push(formatSeriesTimestamp(serverTimestampDate))
    current.setHours(current.getHours() + 1)
  }

  return { values, timestamps, serverTimestamps }
}

const device01TemperatureSeries = buildHourlySeries({
  startAt: '2026-03-13T00:00:00+09:00',
  endAt: '2026-06-13T00:00:00+09:00',
  seed: 1001,
  min: 15.0,
  max: 25.0,
})

export const companies = [
  { id: 'co-minato', name: '南港食品', status: 'active', createdAt: '2026-04-01 10:12:00', updatedAt: '2026-05-28 08:54:21', sites: ['st-cold', 'st-line'] },
  { id: 'co-toto', name: '東都設備', status: 'active', createdAt: '2026-04-03 13:40:18', updatedAt: '2026-05-28 08:52:48', sites: ['st-tank', 'st-energy'] },
  { id: 'co-hokuto', name: '北斗ロジスティクス', status: 'inactive', createdAt: '2026-03-18 09:20:34', updatedAt: '2026-05-21 17:02:09', sites: [] },
]

export const sites = [
  { id: 'st-cold', companyId: 'co-minato', name: '冷蔵倉庫A', address: '大阪市住之江区', status: '有効' },
  { id: 'st-line', companyId: 'co-minato', name: '乾燥ライン1', address: '堺市堺区', status: '有効' },
  { id: 'st-tank', companyId: 'co-toto', name: '屋外タンクヤード', address: '東京都大田区', status: '有効' },
  { id: 'st-energy', companyId: 'co-toto', name: '第2受電室', address: '川崎市川崎区', status: '有効' },
]

export const devices = [
  {
    id: 'DV-1001',
    name: '冷蔵倉庫 A 温湿度',
    companyId: 'co-minato',
    siteId: 'st-cold',
    status: 'online',
    authId: 'auth-dv-1001',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-05-28 09:12:40',
    alert: '正常',
    columns: [
      { key: 'temperature', label: '温度', unit: 'C', type: 'number', weight: 1, order: 1, thresholds: [{ id: 'th-1', name: '冷蔵温度範囲', upper: 8, lower: -2, suppress: 30 }], values: [4.1, 4.2, 4.4, 4.3, 4.7, 5.0, 5.4, 5.1, 4.9, 4.6, 4.3, 4.2] },
      { key: 'humidity', label: '湿度', unit: '%', type: 'number', weight: 1, order: 2, thresholds: [{ id: 'th-2', name: '倉庫湿度範囲', upper: 75, lower: 35, suppress: 30 }], values: [58, 60, 62, 61, 64, 63, 65, 67, 66, 64, 62, 61] },
    ],
  },
  {
    id: 'device01',
    name: 'device01 温度センサー',
    companyId: 'co-minato',
    siteId: 'st-cold',
    status: 'online',
    authId: 'auth-device01',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-06-13 00:00:00',
    alert: '正常',
    columns: [
      {
        key: 'temperature',
        label: '温度',
        unit: 'C',
        type: 'number',
        weight: 1,
        order: 1,
        thresholds: [],
        values: device01TemperatureSeries.values,
        timestamps: device01TemperatureSeries.timestamps,
        serverTimestamps: device01TemperatureSeries.serverTimestamps,
      },
    ],
  },
  {
    id: 'DV-1002',
    name: '乾燥ライン 圧力',
    companyId: 'co-minato',
    siteId: 'st-line',
    status: 'warning',
    authId: 'auth-dv-1002',
    inputType: 'csv',
    csvHeaderMode: 'header_exists',
    latestReceivedAt: '2026-05-28 09:12:18',
    alert: '上限超過',
    columns: [
      { key: 'pressure', label: '圧力', unit: 'MPa', type: 'number', weight: 1000, order: 1, thresholds: [{ id: 'th-3', name: '乾燥ライン圧力', upper: 1.1, lower: 0.4, suppress: 10 }], values: [0.52, 0.58, 0.64, 0.71, 0.76, 0.82, 0.88, 0.96, 1.12, 1.05, 0.98, 0.92] },
      { key: 'running', label: '運転中', unit: '', type: 'boolean', weight: 1, order: 2, thresholds: [], values: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
    ],
  },
  {
    id: 'DV-2044',
    name: '屋外タンク 水位',
    companyId: 'co-toto',
    siteId: 'st-tank',
    status: 'offline',
    authId: 'auth-dv-2044',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-05-28 08:48:03',
    alert: '通信断',
    columns: [
      { key: 'water_level', label: '水位', unit: 'cm', type: 'number', weight: 0.1, order: 1, thresholds: [{ id: 'th-4', name: 'タンク水位', upper: 95, lower: 20, suppress: 60 }], values: [70, 71, 72, 73, 73, 74, 73, 72, 72, 72, 72, 72] },
    ],
  },
  {
    id: 'DV-3188',
    name: '電力量メーター B',
    companyId: 'co-toto',
    siteId: 'st-energy',
    status: 'online',
    authId: 'auth-dv-3188',
    inputType: 'json',
    csvHeaderMode: '-',
    latestReceivedAt: '2026-05-28 09:12:59',
    alert: '正常',
    columns: [
      { key: 'power', label: '電力', unit: 'kWh', type: 'number', weight: 1, order: 1, thresholds: [{ id: 'th-5', name: '受電室電力量', upper: 18, lower: 0, suppress: 20 }], values: [9.2, 9.8, 10.4, 11.6, 12.1, 13.3, 14.0, 13.8, 13.4, 13.1, 12.9, 12.8] },
    ],
  },
]

export const users = [
  { id: 'u-1', loginId: 'sys-admin', userName: 'システム管理者', roleId: 'system_admin', companyId: null, siteId: null, scope: '全企業 / 全現場', status: '有効' },
  { id: 'u-2', loginId: 'minato-admin', userName: '南港食品 管理者', roleId: 'company_admin', companyId: 'co-minato', siteId: null, scope: '南港食品 / 全現場', status: '有効' },
  { id: 'u-3', loginId: 'cold-lead', userName: '冷蔵倉庫 現場管理者', roleId: 'site_admin', companyId: 'co-minato', siteId: 'st-cold', scope: '南港食品 / 冷蔵倉庫A', status: '有効' },
  { id: 'u-4', loginId: 'cold-viewer', userName: '冷蔵倉庫 一般ユーザー', roleId: 'general_user', companyId: 'co-minato', siteId: 'st-cold', scope: '南港食品 / 冷蔵倉庫A', status: '有効' },
]

export const auditLogs = [
  { at: '2026-05-28 09:04:12', user: 'minato-admin', companyId: 'co-minato', siteId: 'st-cold', action: 'threshold_setting_changed', target: 'DV-1001 / temperature' },
  { at: '2026-05-28 08:52:48', user: 'sys-admin', companyId: 'co-toto', siteId: 'st-energy', action: 'site_setting_changed', target: '東都設備 / 第2受電室' },
  { at: '2026-05-28 08:41:03', user: 'cold-lead', companyId: 'co-minato', siteId: 'st-line', action: 'device_setting_changed', target: 'DV-1002' },
  { at: '2026-05-28 08:18:29', user: 'cold-viewer', companyId: 'co-minato', siteId: 'st-cold', action: 'user_setting_changed', target: 'cold-viewer' },
]

export const thresholds = []

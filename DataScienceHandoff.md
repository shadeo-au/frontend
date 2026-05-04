# Data Science 团队 Handoff 行动清单

> 这份文档面向 DS 同学，描述 Self-Check 页面所需的地理/人口/POI 数据的处理任务、来源、产出与交付契约。前端开发与 DS 数据处理可并行——前端阶段一基于 mock 数据跑通，DS 阶段一交付后无缝切换为真实数据。

---

## 1. 上下文

**目标页面**：Shadeo 自测页面 `/self-check`，外加可视化（热力图）页面复用同一份数据。

**核心数据需求**：
- 把每个 suburb 翻译成"area heat profile"（vegetation 等级、surface heat 等级、cool place access 等级、older population 等级、综合 exposure score）
- 提供"附近 cool places"（图书馆 / 社区中心 / 购物中心 / 公园）按距离的查询
- 同一份数据同时支撑可视化页面的 choropleth 热力图

**地理粒度**：**SA1**（Statistical Area Level 1，~370 dwellings 一个，Greater Melbourne 约 12,000 个）。与 RMIT HVI 原生粒度一致。

**覆盖范围**：v1 锁定 **Greater Melbourne** GCC（约 31 个 LGA）。范围外 suburb 由前端做降级提示。

---

## 2. 已完成

- ✅ AURIN HVI（City of Melbourne / Greater Melbourne）GeoJSON 已下载  
  来源：AURIN ADP geoserver  
  端点：`https://adp-access.aurin.org.au/dataset/hvi_cityofgreatermelbourne_sa1_2021`

---

## 3. 待办任务清单

| # | 任务 | 数据来源 | 处理方式 | 交付物 | 优先级 |
|---|---|---|---|---|---|
| **T1** | 下载 ABS SA1 边界 | ABS ASGS 2021 → [Digital Boundary Files 入口页](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs-edition-3/jul2021-jun2026/access-and-downloads/digital-boundary-files)，找 `SA1_2021_AUST_GDA2020.gpkg` | `ogr2ogr` 按 `GCC_NAME21='Greater Melbourne'` 过滤 | `sa1-melbourne.geojson` | P0 |
| **T2** | 下载 ABS Census 2021 GCP（SA1 粒度） | [ABS DataPacks](https://www.abs.gov.au/census/find-census-data/datapacks) → SA1 → 2021 → GCP → Greater Melbourne (2GMEL) | 取 G01 表，对每 SA1 算 `older_pop_pct = (Age65_74 + Age75_84 + Age85plus) / total_persons`，分桶 Low (<12%) / Moderate (12–18%) / High (>18%) | `older-pop-by-sa1.json` | P0 |
| **T3** | 拉 OSM Cool Places | [Overpass API](https://overpass-api.de/)（无需登录） | 一条 Overpass query 拉 Greater Melbourne BBOX 内的 `amenity=library`、`amenity=community_centre`、`shop=mall`、`leisure=park` 的 node/way，含 `name`、`opening_hours`、坐标 | `cool-places-raw.geojson` | P0 |
| **T4** | 计算每 SA1 的 cool place access | T1 + T3 结果 | 对每 SA1 中心点做 1km buffer，count 内含的 cool place 数；分桶 Low (0–1) / Moderate (2–4) / High (≥5) | 合并入 T6 输出 | P0 |
| **T5** | 构建 suburb → SA1 映射表 | ABS SAL 2021 + ABS ASGS SA1（来自 T1） | 对每 suburb 几何与 SA1 几何空间相交，按"相交面积最大"取一个 primary SA1；同时记录 suburb 横跨的所有 SA1 | `suburb-to-sa1.json` 形如 `{ "carlton-vic-3053": { "primary_sa1": "20601110501", "all_sa1s": [...], "centroid": [lng, lat] } }` | P0 |
| **T6** | 合成 area-profiles 主表（自测页面用） | HVI（已有）+ T2 + T4 + T5 | 按 SA1 join，剥离几何，用 T5 把 SA1 关联回 suburb，输出一个按 `suburb_key` 索引的 lookup 表 | `area-profiles.json`（schema 见 §5） | P0 |
| **T7** | 生成可视化 GeoJSON | HVI（已有）+ T2 + T4 | 把 `older_pop_pct`、`cool_place_count` 写入 HVI GeoJSON 每个 feature 的 `properties`，保留几何 | `aurin-hvi-melbourne-enriched.geojson`（visualization 页面用） | P1 |
| **T8** | 提供 cool places 按 suburb 的查表 | T3 + T5 | 把 cool-places-raw 里每个点用 T5 反查所属 suburb，按 suburb 分组，每组按距 suburb centroid 距离排序 | `cool-places-by-suburb.json`（结构见 §5 mock） | P1 |
| **T9** | （可选）ETL 脚本固化 | T1–T8 | 把上述全流程写成可重跑的脚本（推荐 Python + GeoPandas），便于后续数据更新 | `etl/build-area-data.py` | P2 |

---

## 4. 数据落地形式（"放进数据库"的两种选择）

DS 同学可以选两种方式之一交付，**前端代码不依赖具体方式**：

### 方式 A — 静态 JSON 文件（v1 推荐）

- T6、T7、T8 输出的 JSON 直接 commit 进 repo 的 `public/data/`
- 前端 `fetch('/data/area-profiles.json')` 即可
- 优点：零后端、CDN cache、部署简单
- 缺点：每次数据更新要重 deploy

### 方式 B — PostgreSQL/PostGIS + REST API

如果团队已有后端 / 想要更"工程化"的呈现：

```sql
-- area_profiles：自测页面查表（无几何）
CREATE TABLE area_profiles (
  suburb_key             TEXT PRIMARY KEY,        -- "carlton-vic-3053"
  suburb_name            TEXT,                    -- "Carlton"
  postcode               TEXT,
  primary_sa1_code       TEXT,
  hvi_score              NUMERIC,
  hvi_level              TEXT,                    -- "Low" | "Moderate" | "High"
  vegetation_level       TEXT,
  surface_heat_level     TEXT,
  older_pop_pct          NUMERIC,
  older_pop_level        TEXT,
  cool_place_count_1km   INT,
  cool_place_access      TEXT,
  overall_exposure_score INT                      -- 0–5
);

-- cool_places：自测 §3 横滚 + 可视化页用
CREATE TABLE cool_places (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,                  -- "library" | "community_centre" | "shopping_centre" | "park"
  suburb_key      TEXT REFERENCES area_profiles(suburb_key),
  geom            GEOGRAPHY(POINT, 4326),
  opening_hours   TEXT,                           -- OSM 原文
  features        TEXT[]                          -- ["Free Wi-Fi", "Air conditioned", ...]
);

-- sa1_areas：可视化页面 choropleth 用（含几何）
CREATE TABLE sa1_areas (
  sa1_code             TEXT PRIMARY KEY,
  suburb_key           TEXT,
  geom                 GEOGRAPHY(POLYGON, 4326),
  hvi_score            NUMERIC,
  hvi_level            TEXT,
  older_pop_pct        NUMERIC,
  cool_place_count_1km INT
);
```

后端暴露三个 endpoint（前端只需要这三个）：

- `GET /api/area-profile?suburb=carlton-vic-3053` → 返回 area_profiles 一条记录
- `GET /api/cool-places?suburb=carlton-vic-3053&limit=5` 或 `?lat=&lng=&radius_km=` → 返回 cool_places 列表
- `GET /api/heatmap-geojson` → 返回 sa1_areas 全集 GeoJSON（visualization 页用）

---

## 5. 输出 Schema 契约（前端 ↔ DS）

### 5.1 `area-profiles.json`（自测页面用，无几何）

```json
{
  "carlton-vic-3053": {
    "area_id": "20601110501",
    "area_name": "Carlton",
    "postcode": "3053",
    "tree_canopy_level": "Low",
    "tree_canopy_pct": 11,
    "surface_heat_level": "High",
    "cool_place_access": "High",
    "cool_place_count_within_1km": 7,
    "older_population_level": "Moderate",
    "older_population_pct": 14,
    "overall_location_exposure_score": 4
  },
  "brunswick-vic-3056": { "...": "..." },
  "melbourne-vic-3000": { "...": "..." }
}
```

### 5.2 `cool-places-by-suburb.json`（自测 §3 横滚 + 可与导航页共享）

```json
{
  "carlton-vic-3053": [
    {
      "id": "lib-carlton",
      "name": "Carlton Library",
      "type": "library",
      "lat": -37.7991,
      "lng": 144.9665,
      "distance_m": 450,
      "open_hours": "Mon–Sat 10:00–18:00",
      "features": ["Free Wi-Fi", "Air conditioned", "Drinking fountain"]
    },
    { "type": "community_centre": "...": "..." },
    { "type": "shopping_centre": "...": "..." },
    { "type": "park": "...": "..." }
  ]
}
```

### 5.3 `aurin-hvi-melbourne-enriched.geojson`（可视化页面用，含几何）

标准 GeoJSON FeatureCollection，每个 feature 的 `properties` 含：
- `sa1_code` (string)
- `suburb_key` (string)
- `hvi_score` (number)
- `hvi_level` ("Low" | "Moderate" | "High")
- `older_pop_pct` (number)
- `cool_place_count_1km` (integer)

---

## 6. 多对一处理：suburb 横跨多个 SA1

一个 suburb 可能横跨多个 SA1（如 Brunswick）。三种处理方案：

| 策略 | 做法 | 何时选 |
|---|---|---|
| **取面积最大的 SA1** | 选 suburb 几何与之相交面积最大的那个 SA1 | **v1 推荐**，简单 |
| **加权平均** | 按相交面积加权所有 SA1 的指标 | v2 |
| **保留多值** | 给用户展示 "Your suburb spans 2 areas: …" | 太复杂，不推荐 |

→ v1 用"面积最大法"，build 脚本里完成，前端无感知。

---

## 7. Bucket 阈值约定（避免前端假设漂移）

DS 同学决定阈值后，**写入团队共享文档**，前端按值消费：

| 字段 | Low | Moderate | High | 备注 |
|---|---|---|---|---|
| `tree_canopy_level` / `vegetation_level` | < 15% | 15–30% | > 30% | 待 DS 根据 HVI 数据分布 review |
| `surface_heat_level` | 待定 | 待定 | 待定 | 取 HVI 中 LST 子分量分布的三分位 |
| `cool_place_access` | 0–1 places/1km | 2–4 | ≥ 5 | |
| `older_population_level` | < 12% | 12–18% | > 18% | |
| `overall_location_exposure_score` | 0–1 | 2–3 | 4–5 | 0–5 整数（PRD §11.1） |

---

## 8. 前端 / DS 之间的契约

- **DS 同学只需保证 area-profiles.json 的 schema 与 §5.1 一致**（字段名、bucket 取值集合）
- 前端在 Phase 1 就可以基于 mock 的 5–10 个 suburb 跑通整个 §1–§5 流程
- DS 真实数据交付后，**前端只换一个文件路径或 API endpoint**，无需改任何业务代码
- bucket 阈值（什么算 Low/Moderate/High）DS 决定后写入团队共享文档，避免前端假设漂移

---

## 9. 时间线建议

| 周次 | DS 团队 | 前端团队 |
|---|---|---|
| Week 1 | T1, T2, T3 并行下载 | Phase 1（§1 Hero + Open-Meteo + LocationPicker）+ mock area-profiles |
| Week 2 | T5, T4, T6 处理 | Phase 2（§4 Wizard + scoring）|
| Week 3 | T7, T8 输出可视化数据；落库 or 静态发布 | Phase 3（§2 + §3）切真实数据 |
| Week 4 | 数据 QA，bucket 阈值微调 | Phase 4（§5c TodayActionCard）|

---

## 10. 法律 / 引用要求

- ABS / data.vic.gov.au 多数为 CC-BY 4.0，**必须在页面 footer 注明数据来源**
- AURIN 数据使用须遵循各原始数据集的 license，做 attribution
- OSM 数据需声明 "© OpenStreetMap contributors"
- 建议在 `/about` 或 footer 增加一个 "Data sources" 链接，列出全部出处

---

## 11. 如有问题

- AURIN 数据接入或 schema 不清楚：参考 plan 文档 §12.2.1 / §12.2.1.1
- ABS 下载步骤：参考 plan 文档 §12.2.2
- Tree canopy 全墨尔本覆盖策略：参考 plan 文档 §12.2.3
- 完整上下文：见 `prd-misty-conway.md`（plan 文件，含前端规划）

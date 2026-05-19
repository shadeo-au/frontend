<template>
  <main class="route-planner-page enhanced-planner" :class="{ 'is-route-view': isRouteView }">
    <AppNav v-if="!isRouteView" />
    <div class="planner-scene" aria-hidden="true"></div>
    <div class="planner-scene-overlay" aria-hidden="true"></div>

    <nav v-if="!isRouteView" class="planner-step-nav" aria-label="Planner progress">
      <button
        v-for="item in plannerSteps"
        :key="item.id"
        type="button"
        :disabled="!canNavigateToStep(item.id) && currentStep !== item.id"
        :class="{ active: currentStep === item.id, done: item.id < currentStep && canNavigateToStep(item.id), locked: !canNavigateToStep(item.id) && currentStep !== item.id }"
        @click="jumpToStep(item.id)"
      >
        <span>{{ item.id }}</span>
        <small>{{ item.label }}</small>
      </button>
    </nav>

    <section v-if="!isRouteView" class="planner-shell planner-flow-shell">
      <section class="planner-flow-hero">
        <h1>Plan a cooler, easier walk.</h1>
      
      </section>

      <article v-if="visibleStep === 1" class="planner-card planner-step-card planner-guided-card planner-step-pop" ref="startSectionEl">
        <div class="planner-card-heading">
          <span>1</span>
          <div>
            <h2>Starting point</h2>
          </div>
        </div>

        <div class="planner-choice-list">
          <button class="planner-choice-row" :class="{ active: startMode === 'current' }" type="button" @click="useMyLocation">
            <span class="planner-choice-icon" aria-hidden="true">
              <img :src="locationIcon" alt="" />
            </span>
            <span>
              <strong>{{ isLocating ? 'Detecting your current location...' : 'Use my current location' }}</strong>

            </span>
          </button>

          <button class="planner-choice-row" :class="{ active: startMode === 'manual' }" type="button" @click="startMode = 'manual'">
            <span class="planner-choice-icon" aria-hidden="true">
              <img :src="searchIcon" alt="" />
            </span>
            <span>
              <strong>Search address or place</strong>
              <small>Type a street address or landmark as your starting point.</small>
            </span>
          </button>

        </div>

        <form v-if="startMode === 'manual'" class="planner-search-box" @submit.prevent="runStartSearch">
          <label for="planner-start-query">Enter your starting point</label>
          <div class="planner-search-line">
            <input
              id="planner-start-query"
              v-model.trim="startQuery"
              type="text"
              placeholder="Example: State Library Victoria, 328 Swanston St"
            />
            <button class="btn btn-primary" type="submit" :disabled="!startQuery || isSearchingStart">
              {{ isSearchingStart ? 'Searching...' : 'Search' }}
            </button>
          </div>

        </form>

        <div v-if="startSearchResults.length" class="planner-search-results" aria-label="Start search results">
          <button
            v-for="place in startSearchResults"
            :key="place.id"
            type="button"
            :class="{ active: selectedStart?.id === place.id }"
            @click="selectStartPlace(place)"
          >
            <Icon class="planner-search-result-icon" :icon="categoryDisplay(place).icon" aria-hidden="true" />
            <span class="planner-search-result-text">
              <strong>{{ place.name }}</strong>
              <small>{{ place.address }}</small>
              <span v-if="place.category" class="planner-search-result-tag">{{ categoryDisplay(place).label }}</span>
            </span>
          </button>
          <p v-if="startOutOfAreaCount > 0" class="planner-search-hint">
            {{ startOutOfAreaCount }} more result{{ startOutOfAreaCount === 1 ? '' : 's' }} outside our Central Melbourne coverage hidden.
          </p>
        </div>

        <p v-if="selectedStart" class="planner-selection-note">
          Start selected: <strong>{{ selectedStart.name }}</strong>
        </p>
        <p v-if="startValidationMessage" class="planner-selection-note planner-selection-note-error">
          {{ startValidationMessage }}
        </p>
      </article>

      <article v-if="visibleStep === 2" class="planner-card planner-step-card planner-guided-card planner-step-pop" ref="destinationSectionEl">
        <div class="planner-card-heading">
          <span>2</span>
          <div>
            <h2>Destination</h2>
            
          </div>
        </div>

        <div class="planner-segmented">
          <button type="button" :class="{ active: destinationMode === 'category' }" @click="setDestinationMode('category')">
            Choose by type
          </button>
          <button type="button" :class="{ active: destinationMode === 'specific' }" @click="setDestinationMode('specific')">
            Search specific place
          </button>
        </div>

        <div v-if="destinationMode === 'category'" class="planner-category-panel">
          <p class="planner-panel-instruction">Select one destination type. Shadeo will look for nearby walking options.</p>
          <div class="planner-type-grid planner-type-grid-clean">
            <button
              v-for="item in destinationTypes"
              :key="item.id"
              class="planner-type-card"
              :class="{ active: selectedType === item.id }"
              type="button"
              @click="chooseDestinationType(item.id)"
            >
              <span class="planner-type-icon" aria-hidden="true">
                <Icon :icon="item.iconName" />
              </span>
              <span class="planner-type-name">{{ item.label }}</span>
            </button>
          </div>
        </div>

        <form v-if="destinationMode === 'specific'" class="planner-search-box" @submit.prevent="runDestinationSearch">
          <label for="planner-destination-query">Search for a specific destination</label>
          <div class="planner-search-line">
            <input
              id="planner-destination-query"
              v-model.trim="destinationQuery"
              type="text"
              placeholder="Example: Chemist Warehouse Melbourne Central"
            />
            <button class="btn btn-primary" type="submit" :disabled="!destinationQuery || isSearchingDestination">
              {{ isSearchingDestination ? 'Searching...' : 'Search' }}
            </button>
          </div>
          <p>Use this path when you already know where you want to go.</p>
        </form>

        <div v-if="destinationSearchResults.length" class="planner-search-results" aria-label="Destination search results">
          <button
            v-for="place in destinationSearchResults"
            :key="place.id"
            type="button"
            :class="{ active: selectedSpecificDestination?.id === place.id }"
            @click="selectSpecificDestination(place)"
          >
            <Icon class="planner-search-result-icon" :icon="categoryDisplay(place).icon" aria-hidden="true" />
            <span class="planner-search-result-text">
              <strong>{{ place.name }}</strong>
              <small>{{ place.address }}</small>
              <span v-if="place.category" class="planner-search-result-tag">{{ categoryDisplay(place).label }}</span>
            </span>
          </button>
          <p v-if="destinationOutOfAreaCount > 0" class="planner-search-hint">
            {{ destinationOutOfAreaCount }} more result{{ destinationOutOfAreaCount === 1 ? '' : 's' }} outside our Central Melbourne coverage hidden.
          </p>
        </div>

        <p v-if="destinationValidationMessage" class="planner-selection-note planner-selection-note-error">
          {{ destinationValidationMessage }}
        </p>

        <label class="planner-shade-toggle">
          <input type="checkbox" v-model="preferShade" />
          <Icon icon="material-symbols:park" class="planner-shade-toggle-icon" aria-hidden="true" />
          <span class="planner-shade-toggle-text">
            <strong>Prefer shaded route</strong>
            <small>Walk under tree cover where possible (slightly longer)</small>
          </span>
        </label>

        <div class="planner-flow-action">
          <button class="btn planner-change-btn planner-return-btn" type="button" @click="jumpToStep(1)">
            <span aria-hidden="true">&lt;</span>
            Back
          </button>
          <button class="btn btn-primary planner-continue-btn" type="button" :disabled="!canFindRecommendations || isLoadingPlan" @click="requestPlan">
            {{ isLoadingPlan ? 'Requesting route...' : 'Next' }}
            <span aria-hidden="true">&gt;</span>
          </button>
          <p v-if="!canFindRecommendations">Choose a destination path first.</p>
        </div>
      </article>

      <section class="planner-result-anchor" ref="resultsSectionEl">
        <article v-if="visibleStep === 3 && isLoadingPlan" class="planner-card planner-result-loading-card planner-step-pop">
          <span class="planner-spinner" aria-hidden="true"></span>
          <h3>Requesting your route...</h3>
          <p>Shadeo is checking nearby walking options for you.</p>
        </article>

        <article v-else-if="visibleStep === 3 && hasSearched && recommendations.length" class="planner-card planner-recommendation-layout planner-step-pop">
          <div class="planner-recommendation-list">
            <div class="planner-section-headline">
              <p>Results</p>
              <h3>Compare nearby options</h3>
              <span>Select an option to preview its details.</span>
            </div>
            <div class="planner-result-toolbar">
              <label>
                Sort by
                <select v-model="recommendationSort">
                  <option value="score-desc">Highest score</option>
                  <option value="distance-asc">Shortest distance</option>
                  <option value="shade-desc">Most shade</option>
                </select>
              </label>
            </div>
            <article
              v-for="(item, index) in visibleRecommendations"
              :key="item.id"
              class="planner-destination-card"
              :class="{ 'is-top-result': isMostRecommended(item), 'is-selected': highlightedRecommendationId === item.id }"
              @click="highlightRecommendation(item)"
            >
              <span class="planner-destination-rank">{{ index + 1 }}</span>
              <span class="planner-destination-body">
                <span class="planner-destination-topline">
                  <span
                    v-for="badge in recommendationBadges(item)"
                    :key="badge.label"
                    class="planner-rec-label"
                    :class="badge.tone"
                  >
                    <Icon :icon="badge.icon" aria-hidden="true" />
                    {{ badge.label }}
                  </span>
                </span>
                <span class="planner-destination-main">
                  <strong>{{ item.destination.name }}</strong>
                  <small class="planner-destination-address">{{ item.destination.address }}</small>
                </span>
                <span class="planner-card-score">
                  <span>Route score</span>
                  <span class="planner-score-badge planner-score-badge-large" :class="scoreTone(item.score)">
                    <strong>{{ formatCompactScore(item.score) }}</strong>
                    <small>{{ item.ratingLabel || ratingLabelFromScore(item.score) }}</small>
                  </span>
                </span>
                <span class="planner-destination-metrics">
                  <span>
                    <img :src="timeIcon" alt="" aria-hidden="true" />
                    {{ formatMinutes(item.metrics.durationMinutes) }} walk
                  </span>
                  <span>
                    <img :src="locationPinIcon" alt="" aria-hidden="true" />
                    {{ formatDistance(item.metrics.distanceMeters) }}
                  </span>
                </span>
                <span v-if="recommendationFeatureChips(item).length" class="planner-tag-row planner-feature-chip-row">
                  <em
                    v-for="chip in recommendationFeatureChips(item)"
                    :key="chip.key"
                    :class="chip.tone"
                  >
                    <img v-if="chip.iconSrc" :src="chip.iconSrc" alt="" aria-hidden="true" />
                    <Icon v-else :icon="chip.icon" aria-hidden="true" />
                    {{ chip.label }}
                  </em>
                </span>
                <button
                  v-if="highlightedRecommendationId === item.id"
                  class="planner-view-details"
                  type="button"
                  @click.stop="openRecommendationDetails(item)"
                >
                  View detail
                </button>
              </span>
            </article>
            <div class="planner-result-actions">
              <button class="btn planner-change-btn planner-return-btn" type="button" @click="jumpToStep(2)">
                <span aria-hidden="true">&lt;</span>
                Back
              </button>
              <button class="btn btn-primary planner-see-route-btn" type="button" :disabled="!selectedRecommendation || !canSeeRoute" @click="openRouteReadinessPrompt">
                See route <span aria-hidden="true">&gt;</span>
              </button>
            </div>
          </div>
          <div class="planner-mini-map-panel">
            <div class="planner-mini-map-head">
              <strong>Nearby options</strong>
              <span>Your selected start point and the nearby options.</span>
            </div>
            <div ref="miniMapEl" class="planner-mini-map"></div>
          </div>
        </article>

        <article v-else-if="visibleStep === 3 && hasSearched && !isLoadingPlan && !recommendations.length" class="planner-card planner-result-loading-card planner-step-pop">
          <button class="planner-step-back-btn" type="button" @click="jumpToStep(2)">
            <span aria-hidden="true">&lt;</span>
            Back
          </button>
          <h3>No walking option found</h3>
          <p>{{ planError || 'We could not find a suitable walking option for this start point and destination.' }}</p>
        </article>
      </section>
    </section>

    <div v-if="isDetailOpen && detailRecommendation" class="planner-detail-backdrop" role="presentation" @click.self="closeRecommendationDetails">
      <section class="planner-detail-modal planner-card" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <button class="planner-modal-close" type="button" aria-label="Close details" @click="closeRecommendationDetails">X</button>
        <div class="planner-detail-title-row">
          <img :src="recommendationTypeIconUrl(detailRecommendation)" alt="" />
          <div>
            <h3 id="detail-title">{{ detailRecommendation.destination.name }}</h3>
          </div>
        </div>
        <div class="planner-detail-grid">
          <span class="planner-metric-chip">
            <img :src="walkIcon" alt="" aria-hidden="true" />
            <strong>{{ formatDistance(detailRecommendation.metrics.distanceMeters) }}</strong>
            <small>away</small>
          </span>
          <span class="planner-metric-chip">
            <img :src="timeIcon" alt="" aria-hidden="true" />
            <strong>{{ formatMinutes(detailRecommendation.metrics.durationMinutes) }}</strong>
            <small>walk</small>
          </span>
          <span class="planner-metric-chip planner-metric-chip-shade">
            <Icon icon="material-symbols:park" aria-hidden="true" />
            <strong>{{ recommendationShadeLabel(detailRecommendation) }}</strong>
            <small>tree shade</small>
          </span>
        </div>
        <section v-if="hasDetailScore" class="planner-detail-rating" :class="scoreTone(detailRecommendation.score)">
          <div class="planner-detail-rating-head">
            <div>
              <span>Route rating</span>
              <strong>{{ detailRatingLabel }}</strong>
            </div>
            <em>{{ formatScore(detailRecommendation.score) }}</em>
          </div>
          <p v-if="detailRecommendation.ratingReason">{{ detailRecommendation.ratingReason }}</p>
          <div class="planner-score-breakdown">
            <div v-for="row in detailScoreBreakdownRows" :key="row.key" class="planner-score-row">
              <div class="planner-score-row-top">
                <span>{{ row.label }}</span>
                <strong>{{ row.displayValue }}</strong>
              </div>
              <div class="planner-score-bar" aria-hidden="true">
                <span :style="{ width: `${row.percent}%` }"></span>
              </div>
              <small>{{ row.meta }}</small>
            </div>
          </div>
        </section>
        <div class="planner-detail-info-list">
          <div v-for="row in detailInfoRows" :key="row.key">
            <strong>{{ row.label }}</strong>
            <a v-if="row.href" :href="row.href" target="_blank" rel="noreferrer">{{ row.value }}</a>
            <span v-else>{{ row.value }}</span>
          </div>
          <div v-if="hasDetailFacilities">
            <strong>Along the way</strong>
            <span>{{ detailFacilitySummaryText }}</span>
          </div>
        </div>
        <div class="rv-fac-grid planner-detail-facility-grid">
          <div class="rv-fac-card rv-fac-bench">
            <img :src="benchIcon" alt="" />
            <div>
              <strong>{{ detailFacilityBreakdown.bench }}</strong>
              <span>Benches</span>
            </div>
          </div>
          <div class="rv-fac-card rv-fac-toilet">
            <img :src="toiletIcon" alt="" />
            <div>
              <strong>{{ detailFacilityBreakdown.toilet }}</strong>
              <span>Toilets</span>
            </div>
          </div>
          <div class="rv-fac-card rv-fac-fountain">
            <img :src="fountainIcon" alt="" />
            <div>
              <strong>{{ detailFacilityBreakdown.drinking_fountain }}</strong>
              <span>Fountains</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="isReadinessPromptOpen" class="planner-readiness-backdrop" role="presentation">
      <section class="planner-readiness-modal planner-readiness-prompt" role="dialog" aria-modal="true" aria-labelledby="readiness-prompt-title">
        <button class="planner-modal-close" type="button" aria-label="Close readiness prompt" @click="closeReadinessToResults">X</button>
        <div class="planner-readiness-head">
          <div>
            <p>Before you go</p>
            <h2 id="readiness-prompt-title">A quick readiness check is strongly recommended.</h2>
          </div>
        </div>
        <p class="planner-readiness-advice">
          The checklist helps you review weather, everyday items, and destination reminders before opening the full map.
        </p>
        <div class="planner-summary-actions planner-prompt-actions">
          <button class="btn planner-change-btn" type="button" @click="skipReadinessAndOpenRoute">Skip</button>
          <button class="btn btn-primary planner-ready-btn" type="button" @click="readReadinessChecklist">Read checklist</button>
        </div>
      </section>
    </div>

    <div v-if="isReadinessOpen" class="planner-readiness-backdrop" role="presentation">
      <section class="planner-readiness-modal" role="dialog" aria-modal="true" aria-labelledby="readiness-title">
        <button class="planner-modal-close" type="button" aria-label="Close checklist" @click="closeReadinessToResults">X</button>
        <div class="planner-readiness-head">
          <div>
            <p>Pre-trip Check</p>
            <h2 id="readiness-title">Are you ready to go?</h2>
          </div>
        </div>

        <div class="planner-readiness-block planner-weather-card">
          <div class="planner-weather-brief-head">
            <div>
              <h3>{{ weatherTripHeading }}</h3>
              <p>{{ weatherTripDescription }}</p>
            </div>
            <span class="planner-weather-ai-badge">
              <Icon icon="material-symbols:verified-rounded" aria-hidden="true" />
              Pre-trip guidance
            </span>
          </div>

          <div class="planner-weather-trip-switch" role="group" aria-label="Choose trip timing">
            <button
              v-for="option in weatherTripOptions"
              :key="option.value"
              type="button"
              :class="{ active: tripDate === option.value }"
              @click="setTripDate(option.value)"
            >
              <span>{{ option.label }}</span>
              <small>{{ option.description }}</small>
            </button>
          </div>

          <div v-if="weather.isLoading" class="planner-weather-loading" aria-label="Loading weather guidance">
            <section class="planner-weather-summary-skeleton">
              <span></span>
              <div>
                <strong></strong>
                <small></small>
              </div>
            </section>
            <div class="planner-weather-factor-grid">
              <article v-for="index in 3" :key="index" class="planner-weather-factor-skeleton">
                <span></span>
                <em></em>
                <strong></strong>
                <small></small>
              </article>
            </div>
          </div>

          <template v-else>
            <section class="planner-weather-summary-card" :class="weatherAdvice.tone">
              <span class="planner-weather-summary-icon" aria-hidden="true">
                <Icon :icon="weatherStatusIcon(weatherAdvice.tone)" />
              </span>
              <div>
                <strong>{{ weatherAdvice.label }}</strong>
                <span>{{ weatherAdvice.summary }}</span>
                <small>{{ weatherUpdatedText }}</small>
              </div>
            </section>

            <div v-if="weatherFactorCards.length" class="planner-weather-factor-grid">
              <article
                v-for="card in weatherFactorCards"
                :key="card.key"
                class="planner-weather-factor-card"
                :class="card.tone"
              >
                <div class="planner-weather-factor-top">
                  <Icon :icon="card.icon" aria-hidden="true" />
                </div>
                <strong>
                  <span class="planner-weather-factor-label">{{ card.label }}</span>
                  {{ card.title }}
                </strong>
              </article>
            </div>
          </template>
        </div>

        <div class="planner-readiness-block">
          <h3>{{ selectedTypeLabel }} reminders</h3>
          <p class="planner-check-intro">{{ destinationChecklistIntro }}</p>
          <label v-for="item in destinationChecklistItems" :key="item.id" class="planner-check-row">
            <input v-model="readiness.tripItems" type="checkbox" :value="item.label" />
            <span>{{ item.label }}</span>
          </label>
        </div>

        <div v-if="destinationKind === 'grocery'" class="planner-readiness-block">
          <h3>Shopping list</h3>
          <p class="planner-check-intro">Add a few things you want to buy. Your list will stay visible on the route map.</p>
          <form class="planner-shopping-form" @submit.prevent="addShoppingItem">
            <input
              v-model.trim="shoppingInput"
              type="text"
              placeholder="Example: milk, bread, bananas"
              aria-label="Shopping item"
            />
            <button type="submit" aria-label="Add shopping item">+</button>
          </form>
          <ul v-if="shoppingItems.length" class="planner-shopping-list">
            <li v-for="item in shoppingItems" :key="item.id">
              <span>{{ item.text }}</span>
              <button type="button" :aria-label="`Remove ${item.text}`" @click="removeShoppingItem(item.id)">Remove</button>
            </li>
          </ul>
        </div>

        <div class="planner-readiness-block">
          <h3>Everyday items</h3>
          <p class="planner-check-intro">A quick check can help you avoid turning back after you leave.</p>
          <label v-for="item in essentialItems" :key="item.id" class="planner-check-row">
            <input v-model="readiness.essentials" type="checkbox" :value="item.label" />
            <span>{{ item.label }}</span>
          </label>
        </div>

        <div class="planner-summary-actions planner-readiness-actions">
          <button class="btn btn-primary planner-ready-btn" type="button" @click="confirmReadyToGo">Open route</button>
        </div>
      </section>
    </div>

    <section v-if="isRouteView" class="planner-route-shell">
      <aside class="planner-route-panel rv-panel">
        <button class="planner-step-back-btn rv-back-btn" @click="showStep(3)">
          <span aria-hidden="true">&lt;</span>
          Back
        </button>

        <div class="rv-dest-header">
          <div class="rv-dest-icon-wrap">
            <img :src="selectedTypeIconUrl" alt="" />
          </div>
          <div class="rv-dest-info">
            <p class="rv-dest-type-label">{{ selectedTypeLabel }}</p>
            <h2 class="rv-dest-name">{{ result.destination?.name }}</h2>
            <p v-if="result.destination?.address" class="rv-dest-address">{{ result.destination.address }}</p>
          </div>
        </div>

        <div class="rv-stats-row">
          <div class="rv-stat-card">
            <div class="rv-stat-main">
              <strong>{{ walkMinutes }}</strong>
              <strong>MIN</strong>
            </div>
            <span>Walking time</span>
          </div>
          <div class="rv-stat-card">
            <div class="rv-stat-main">
              <strong>{{ distanceMetric.value }}</strong>
              <strong>{{ distanceMetric.unit.toUpperCase() }}</strong>
            </div>
            <span>Distance away</span>
          </div>
        </div>

        <div class="rv-section">
          <h3>Along the way</h3>
          <div class="rv-fac-grid rv-route-fac-grid">
            <div class="rv-fac-card rv-fac-bench">
              <img :src="benchIcon" alt="" />
              <div>
                <strong>{{ facilityBreakdown.bench }}</strong>
                <span>Benches</span>
              </div>
            </div>
            <div class="rv-fac-card rv-fac-toilet">
              <img :src="toiletIcon" alt="" />
              <div>
                <strong>{{ facilityBreakdown.toilet }}</strong>
                <span>Toilets</span>
              </div>
            </div>
            <div class="rv-fac-card rv-fac-fountain">
              <img :src="fountainIcon" alt="" />
              <div>
                <strong>{{ facilityBreakdown.drinking_fountain }}</strong>
                <span>Fountains</span>
              </div>
            </div>
          </div>
        </div>

        <div class="rv-section rv-legend-section">
          <h3>Map legend</h3>
          <div class="rv-legend-list">
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-start">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="4" r="2.5"/><path d="M10 8.5c-1.1 0-2 .9-2 2v4h2v5h4v-5h2v-4c0-1.1-.9-2-2-2h-4z"/></svg>
              </div>
              You (start)
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-dest">
                <img :src="selectedTypeIconUrl" width="15" height="15" />
              </div>
              Destination
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-bench">
                <img :src="benchIcon" width="15" height="15" style="filter:invert(1)" />
              </div>
              Bench
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-toilet">
                <img :src="toiletIcon" width="15" height="15" style="filter:invert(1)" />
              </div>
              Toilet
            </div>
            <div class="rv-legend-row">
              <div class="rv-legend-icon rv-licon-fountain">
                <img :src="fountainIcon" width="15" height="15" style="filter:invert(1)" />
              </div>
              Drinking fountain
            </div>
            <div class="rv-legend-row">
              <span class="rv-ldot rv-ldot-route"></span>
              Walking route
            </div>
            <div class="rv-legend-row">
              <span class="rv-ldot rv-ldot-shade"></span>
              Tree canopy shade
            </div>
          </div>
        </div>

      </aside>

      <section class="planner-route-map-area">
        <div v-if="isLoadingPlan" class="planner-map-loading" role="status" aria-live="polite">
          <span class="planner-spinner" aria-hidden="true"></span>
          <p>Loading route map...</p>
        </div>
        <aside v-if="showMapShoppingList" class="planner-map-shopping-card" aria-label="Shopping list">
          <strong>Shopping list</strong>
          <ul>
            <li v-for="item in shoppingItems" :key="item.id">{{ item.text }}</li>
          </ul>
        </aside>
        <div ref="mapEl" class="planner-route-map"></div>
      </section>
    </section>

    <AppFooter v-if="!isRouteView" />
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import AppNav from '../components/AppNav.vue'
import AppFooter from '../components/AppFooter.vue'
import { Icon } from '@iconify/vue'
import pharmacyIcon from '../assets/svg/pharmacy.svg'
import groceryIcon from '../assets/svg/grocery.svg'
import clinicIcon from '../assets/svg/clinic.svg'
import parkIcon from '../assets/svg/park.svg'
import cafeIcon from '../assets/svg/break-cafe.svg'
import locationIcon from '../assets/svg/location-icon.svg'
import locationPinIcon from '../assets/svg/location-pin.svg'
import searchIcon from '../assets/svg/search.svg'
import walkIcon from '../assets/svg/walk.svg'
import timeIcon from '../assets/svg/time-icon.svg'
import benchIcon from '../assets/svg/bench-icon.svg'
import toiletIcon from '../assets/svg/toilet-icon.svg'
import fountainIcon from '../assets/svg/drinking-fountain-icon.svg'
import {
  buildWeatherFactorCard,
  buildWeatherRequest,
  formatTripDateLabel,
  normaliseTripDate,
  weatherSuitabilityEndpoint,
} from '../lib/weather-suitability.js'

const DEFAULT_MAP_CENTER = { lat: -37.8136, lng: 144.9631 }
const MAP_VIEW_BOUNDS = [[-37.895, 144.875], [-37.735, 145.055]]
const MAP_MIN_ZOOM = 12
const MAP_MAX_ZOOM = Number(import.meta.env.VITE_MAP_MAX_ZOOM || 18)
const PMTILES_MAX_DATA_ZOOM = Number(import.meta.env.VITE_PMTILES_MAX_DATA_ZOOM || 16)
const MUNICIPAL_BOUNDARY_URL = '/data/municipal-boundary.geojson'
const SUPPORTED_AREA_ERROR = 'This location is outside our current Central Melbourne coverage area.'
const MAP_STYLE_URL = import.meta.env.VITE_MAP_STYLE_URL || '/styles/positron/style.json'
const PMTILES_URL = import.meta.env.VITE_PMTILES_URL || 'https://pub-64269a193cf745e5b366a287e94c5196.r2.dev/maps/melbourne-v2.pmtiles'
const MAP_GLYPHS_URL = import.meta.env.VITE_MAP_GLYPHS_URL || '/fonts/{fontstack}/{range}.pbf'
const MAP_SPRITE_URL = import.meta.env.VITE_MAP_SPRITE_URL || '/styles/positron/sprite'
const ROUTE_SERVICE_URL = import.meta.env.VITE_ROUTE_SERVICE_URL || 'https://krdihvgnt5.execute-api.ap-southeast-2.amazonaws.com/default/new-route-service'
const PLACE_SEARCH_URL = import.meta.env.VITE_PLACE_SEARCH_URL || 'https://t0413oh804.execute-api.ap-southeast-2.amazonaws.com/default/place-search-service'
const CANOPY_QUERY_URL = import.meta.env.VITE_CANOPY_QUERY_URL || 'https://ev1dboadg5.execute-api.ap-southeast-2.amazonaws.com/default/canopy-query-service'
const DEBUG_PLANNER = import.meta.env.DEV || import.meta.env.VITE_DEBUG_PLANNER === 'true'

const pmtilesProtocol = new Protocol()
maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile)

const plannerSteps = [
  { id: 1, label: 'Start' },
  { id: 2, label: 'Destination' },
  { id: 3, label: 'Results' },
  { id: 4, label: 'Route' }
]

// Each destination type has both `icon` (legacy SVG URL, used for map markers
// and route-detail thumbnails) and `iconName` (Iconify Material Symbols, used
// in the type-selector cards and recommendation cards). The Iconify names
// match the POI_CATEGORY_DISPLAY map so cards and search results look
// consistent throughout the app.
const destinationTypes = [
  { id: 'pharmacy', label: 'Pharmacy', icon: pharmacyIcon, iconName: 'material-symbols:local-pharmacy' },
  { id: 'clinic',   label: 'Clinic',   icon: clinicIcon,   iconName: 'material-symbols:medical-services' },
  { id: 'grocery',  label: 'Grocery',  icon: groceryIcon,  iconName: 'material-symbols:shopping-cart' },
  { id: 'cafe',     label: 'Cafe',     icon: cafeIcon,     iconName: 'material-symbols:local-cafe' },
  { id: 'park',     label: 'Park',     icon: parkIcon,     iconName: 'material-symbols:park' }
]

const essentialItems = [
  { id: 'keys', label: 'Keys' },
  { id: 'phone', label: 'Charged mobile phone' },
  { id: 'wallet', label: 'Wallet, bank card, or transport card' },
  { id: 'water', label: 'Water bottle' },
  { id: 'glasses', label: 'Glasses, hearing aids, or walking aid if you use them' },
  { id: 'shoes', label: 'Comfortable shoes' },
  { id: 'home', label: 'Door locked and stove or appliances turned off' },
  { id: 'share', label: 'Tell someone where you are going if that helps you feel safer' }
]

const destinationChecklistByType = {
  grocery: {
    intro: 'A small list can make shopping easier and reduce the chance of forgetting something.',
    items: [
      { id: 'bag', label: 'Reusable shopping bag or trolley' },
      { id: 'payment', label: 'Payment card or cash' },
      { id: 'loyalty', label: 'Store card, discount card, or coupons if you use them' },
      { id: 'weight', label: 'Plan to buy only what feels comfortable to carry home' }
    ]
  },
  pharmacy: {
    intro: 'Before visiting the pharmacy, check the items that help staff support you quickly.',
    items: [
      { id: 'prescription', label: 'Prescription, refill notice, or medicine box' },
      { id: 'medicine-list', label: 'List of medicines you currently take' },
      { id: 'medicare', label: 'Medicare card, concession card, or pharmacy card' },
      { id: 'questions', label: 'Questions you want to ask the pharmacist' }
    ]
  },
  clinic: {
    intro: 'For a clinic visit, bring the information your doctor or nurse may need.',
    items: [
      { id: 'appointment', label: 'Appointment time and clinic details' },
      { id: 'medicare', label: 'Medicare card and any health insurance card' },
      { id: 'referral', label: 'Referral letter, test results, or previous reports if you have them' },
      { id: 'medicines', label: 'Current medicine list and allergy information' },
      { id: 'notes', label: 'Notes about symptoms or questions you want to discuss' }
    ]
  },
  cafe: {
    intro: 'For a cafe stop, check a few small things before you go.',
    items: [
      { id: 'payment', label: 'Payment card or cash' },
      { id: 'booking', label: 'Booking details if you made a reservation' },
      { id: 'glasses', label: 'Reading glasses if you need them for the menu' },
      { id: 'diet', label: 'Any diet or allergy notes you may want to mention' }
    ]
  },
  park: {
    intro: 'For a park visit, prepare for comfort outdoors.',
    items: [
      { id: 'sun', label: 'Hat, sunglasses, or sunscreen' },
      { id: 'layer', label: 'Light jacket or umbrella if the weather may change' },
      { id: 'seat', label: 'Check where benches or rest spots are along the way' },
      { id: 'support', label: 'Walking aid or support item if you use one' }
    ]
  },
  default: {
    intro: 'Check the items that may help with this trip.',
    items: [
      { id: 'details', label: 'Destination address or appointment details' },
      { id: 'payment', label: 'Payment card or cash if needed' },
      { id: 'notes', label: 'Any notes or documents for this visit' }
    ]
  }
}

const startMode = ref('')
const destinationMode = ref('category')
const selectedStart = ref(null)
const selectedSpecificDestination = ref(null)
const selectedType = ref('')
const startQuery = ref('')
const destinationQuery = ref('')
const startSearchResults = ref([])
const destinationSearchResults = ref([])
const startOutOfAreaCount = ref(0)
const destinationOutOfAreaCount = ref(0)
const recommendations = ref([])
const highlightedRecommendationId = ref('')
const recommendationSort = ref('score-desc')
const isSearchingStart = ref(false)
const isSearchingDestination = ref(false)
const isLoadingPlan = ref(false)
// Whether the user wants to prefer shaded streets when planning the route.
// Sent to the backend as preferShade=true; backend returns shadeCoverage on
// the routeSummary so we can display "Your route is N% shaded".
const preferShade = ref(false)
const isLocating = ref(false)
const isDetailOpen = ref(false)
const isReadinessPromptOpen = ref(false)
const isReadinessOpen = ref(false)
const isRouteView = ref(false)
const hasSearched = ref(false)
const planError = ref('')
const startValidationMessage = ref('')
const destinationValidationMessage = ref('')
const visibleStep = ref(1)
const maxReachableStep = ref(1)

const readiness = reactive({ tripItems: [], essentials: [] })
const weather = reactive({ isLoading: false, error: '', suitability: null })
const tripDate = ref(normaliseTripDate(import.meta.env.VITE_DEFAULT_TRIP_DATE))
const shoppingInput = ref('')
const shoppingItems = ref([])
const result = reactive({
  destination: null,
  facilities: [],
  route: [],
  metrics: { distanceMeters: null, durationMinutes: null },
  score: null,
  routeRating: null,
  ratingLabel: '',
  ratingReason: '',
  scoreBreakdown: {},
  facilitySummary: {},
  canopy: null,
  comfortNotes: [],
  instructions: []
})

const startSectionEl = ref(null)
const destinationSectionEl = ref(null)
const resultsSectionEl = ref(null)
const miniMapEl = ref(null)
const mapEl = ref(null)

let miniMap = null
let map = null
let boundaryGeoJsonPromise = null
let mapStylePromise = null
let routeDashFrame = null
let routeDashOffset = 0
const miniMapMarkers = []
const routeMapMarkers = []

const hasDestination = computed(() => !!result.destination)
const selectedRecommendation = computed(() => recommendations.value.find((item) => item.id === highlightedRecommendationId.value) || null)
const detailRecommendation = computed(() => selectedRecommendation.value)
const RECOMMENDATION_SCORE_TOLERANCE = 5
const finite = (value, fallback) => Number.isFinite(value) ? value : fallback
const recommendationScoreValue = (item) => Number(item?.score)
const recommendationDistanceValue = (item) => Number(item?.metrics?.distanceMeters)
const compareByScoreThenDistance = (a, b) => {
  const aScore = finite(recommendationScoreValue(a), -Infinity)
  const bScore = finite(recommendationScoreValue(b), -Infinity)
  const aDistance = finite(recommendationDistanceValue(a), Infinity)
  const bDistance = finite(recommendationDistanceValue(b), Infinity)
  const distanceDiff = aDistance - bDistance
  if (
    Number.isFinite(aScore)
    && Number.isFinite(bScore)
    && Number.isFinite(aDistance)
    && Number.isFinite(bDistance)
    && Math.abs(aScore - bScore) <= RECOMMENDATION_SCORE_TOLERANCE
    && distanceDiff !== 0
  ) {
    return distanceDiff
  }
  const scoreDiff = bScore - aScore
  if (scoreDiff !== 0) return scoreDiff
  if (distanceDiff !== 0) return distanceDiff
  return String(a?.id || '').localeCompare(String(b?.id || ''))
}
const visibleRecommendations = computed(() => {
  const items = [...recommendations.value]
  const valueFor = (item, key) => {
    if (key === 'score') return Number(item.score)
    if (key === 'distance') return Number(item.metrics?.distanceMeters)
    if (key === 'shade') return Number(item.metrics?.shadeCoverage)
    if (key === 'time') return Number(item.metrics?.durationMinutes)
    return Number.NaN
  }

  if (recommendationSort.value === 'distance-asc') {
    return items.sort((a, b) => finite(valueFor(a, 'distance'), Infinity) - finite(valueFor(b, 'distance'), Infinity))
  }
  if (recommendationSort.value === 'shade-desc') {
    return items.sort((a, b) => finite(valueFor(b, 'shade'), -Infinity) - finite(valueFor(a, 'shade'), -Infinity))
  }
  return items.sort(compareByScoreThenDistance)
})
const topRecommendationScore = computed(() => Math.max(...recommendations.value.map((item) => Number(item.score)).filter(Number.isFinite), -Infinity))
const topRecommendationId = computed(() => {
  const topRecommendation = recommendations.value
    .filter((item) => Number.isFinite(recommendationScoreValue(item)))
    .sort(compareByScoreThenDistance)[0]
  return topRecommendation?.id || ''
})
const topShadeCoverage = computed(() => Math.max(...recommendations.value.map((item) => Number(item.metrics?.shadeCoverage)).filter(Number.isFinite), -Infinity))
const destinationKind = computed(() => selectedType.value || result.destination?.type || selectedSpecificDestination.value?.type || '')
const selectedTypeLabel = computed(() => destinationTypes.find((d) => d.id === selectedType.value)?.label || selectedSpecificDestination.value?.type || 'Destination')
const selectedTypeIconUrl = computed(() => destinationTypes.find((d) => d.id === selectedType.value || d.id === selectedSpecificDestination.value?.type)?.icon || parkIcon)
const destinationReadyLabel = computed(() => {
  if (destinationMode.value === 'specific') return selectedSpecificDestination.value?.name || ''
  return selectedType.value ? selectedTypeLabel.value : ''
})
const canFindRecommendations = computed(() => !!selectedStart.value && (destinationMode.value === 'specific' ? !!selectedSpecificDestination.value : !!selectedType.value))
const currentStep = computed(() => {
  if (isRouteView.value || isReadinessOpen.value || isReadinessPromptOpen.value) return 4
  return visibleStep.value
})
const shadeMetric = computed(() => {
  const v = result.metrics?.shadeCoverage
  if (!Number.isFinite(v)) return null
  return { value: Math.round(v * 100) }
})

const routeDistanceMeters = computed(() => Number.isFinite(result.metrics.distanceMeters) ? result.metrics.distanceMeters : 0)
const distanceMetric = computed(() => routeDistanceMeters.value >= 1000
  ? { value: (routeDistanceMeters.value / 1000).toFixed(2), unit: 'km' }
  : { value: `${Math.round(routeDistanceMeters.value || 0)}`, unit: 'm' })
const walkMinutes = computed(() => Number.isFinite(result.metrics.durationMinutes) ? `${Math.max(1, Math.round(result.metrics.durationMinutes))}` : '--')
const walkMetric = computed(() => ({ value: walkMinutes.value, unit: 'min' }))
const facilityBreakdown = computed(() => {
  if (!hasDestination.value && selectedRecommendation.value) return facilityBreakdownForRecommendation(selectedRecommendation.value)
  const output = { bench: 0, drinking_fountain: 0, toilet: 0 }
  Object.entries(result.facilitySummary || {}).forEach(([key, value]) => {
    if (output[key] !== undefined && Number.isFinite(Number(value))) output[key] = Number(value)
  })
  if (Object.values(output).some((value) => value > 0)) return output
  result.facilities.forEach((item) => {
    if (output[item.type] !== undefined) output[item.type] += 1
  })
  return output
})
const detailFacilityBreakdown = computed(() => detailRecommendation.value ? facilityBreakdownForRecommendation(detailRecommendation.value) : { bench: 0, drinking_fountain: 0, toilet: 0 })
const detailFacilitySummaryText = computed(() => {
  const names = facilityTypeNames(detailFacilityBreakdown.value)
  return names.length ? `You may pass ${names.join(', ')}.` : ''
})
const hasDetailFacilities = computed(() => Object.values(detailFacilityBreakdown.value).some((value) => value > 0))
const hasDetailScore = computed(() => Number.isFinite(Number(detailRecommendation.value?.score)))
const detailRatingLabel = computed(() => detailRecommendation.value?.ratingLabel || ratingLabelFromScore(detailRecommendation.value?.score))
const detailScoreBreakdownRows = computed(() => {
  const recommendation = detailRecommendation.value
  const breakdown = recommendation?.scoreBreakdown || {}
  const weights = breakdown.weights || {}
  const rows = [
    {
      key: 'shade',
      label: 'Shade',
      value: Number(breakdown.shade),
      max: Number(weights.shade ?? 45),
      meta: Number.isFinite(Number(breakdown.shadeCoverage))
        ? `${Math.round(Number(breakdown.shadeCoverage) * 100)}% tree shade coverage`
        : 'Tree shade contribution'
    },
    {
      key: 'facilities',
      label: 'Facilities',
      value: Number(breakdown.facilities),
      max: Number(weights.facilities ?? 30),
      meta: facilityCountText(breakdown)
    },
    {
      key: 'distance',
      label: 'Distance',
      value: Number(breakdown.distance),
      max: Number(weights.distance ?? 25),
      meta: Number.isFinite(Number(breakdown.distanceMeters))
        ? `${formatDistance(Number(breakdown.distanceMeters))} walking route`
        : 'Shorter routes score higher'
    }
  ]
  if (breakdown.slopeCoverage !== undefined && breakdown.slopeCoverage !== null) {
    const slopeIncluded = Boolean(breakdown.slopeIncludedInScore)
    const averageSlope = Number(breakdown.averageSlopePercent)
    rows.push({
      key: 'slope',
      label: 'Slope',
      value: Number(breakdown.slope),
      max: Number(weights.slope ?? 15),
      meta: slopeIncluded && Number.isFinite(averageSlope)
        ? `${averageSlope.toFixed(1)}% average slope`
        : 'Slope information limited for this route',
      displayOverride: slopeIncluded ? '' : 'Not included'
    })
  }

  return rows.map((row) => {
    const value = Number.isFinite(row.value) ? row.value : 0
    const max = Number.isFinite(row.max) && row.max > 0 ? row.max : 1
    return {
      ...row,
      displayValue: row.displayOverride || `${formatScorePart(value)} / ${formatScorePart(max)}`,
      percent: Math.max(0, Math.min(100, Math.round((value / max) * 100)))
    }
  })
})
const websiteHref = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  return /^https?:\/\//i.test(text) ? text : `https://${text}`
}
const detailInfoRows = computed(() => {
  const destination = detailRecommendation.value?.destination || {}
  return [
    { key: 'address', label: 'Address', value: destination.address || '' },
    { key: 'opening-hours', label: 'Opening hours', value: destination.openingHours || '' },
    { key: 'website', label: 'Website', value: destination.website || '', href: websiteHref(destination.website) },
    { key: 'phone', label: 'Phone', value: destination.phone || '' },
    { key: 'wheelchair', label: 'Wheelchair access', value: destination.wheelchair || '' },
    { key: 'cuisine', label: 'Cuisine', value: destination.cuisine || '' },
    { key: 'brand', label: 'Brand', value: destination.brand || '' },
    { key: 'operator', label: 'Operator', value: destination.operator || '' },
    { key: 'last-updated', label: 'Last updated', value: destination.lastUpdated || '' },
  ].filter((row) => String(row.value || '').trim())
})
const hasAnyFacility = computed(() => Object.values(facilityBreakdown.value).some((value) => value > 0))
const routeComfortNotes = computed(() => result.comfortNotes.length ? result.comfortNotes : readinessRouteAlerts.value)
const scoreBreakdownRows = computed(() => [
  { key: 'shade', label: 'Shade', value: result.scoreBreakdown.shade ?? '--' },
  { key: 'facilities', label: 'Facilities', value: result.scoreBreakdown.facilities ?? '--' },
  { key: 'distance', label: 'Distance', value: result.scoreBreakdown.distance ?? '--' }
])
const destinationChecklist = computed(() => destinationChecklistByType[destinationKind.value] || destinationChecklistByType.default)
const destinationChecklistIntro = computed(() => destinationChecklist.value.intro)
const destinationChecklistItems = computed(() => destinationChecklist.value.items)
const weatherTripOptions = [
  { value: 'today', label: 'Today', description: 'Before you leave' },
  { value: 'tomorrow', label: 'Tomorrow', description: 'Plan ahead' },
]
const weatherTripHeading = computed(() => (
  tripDate.value === 'tomorrow' ? 'Weather for tomorrow' : 'Weather before you leave'
))
const weatherTripDescription = computed(() => (
  tripDate.value === 'tomorrow'
    ? 'AI weather guidance for planning this walk tomorrow.'
    : 'AI weather guidance for this walk today.'
))
const weatherSuitabilityTone = (label) => {
  if (label === 'Not Recommended') return 'danger'
  if (label === 'Caution') return 'caution'
  return 'normal'
}
const weatherStatusIcon = (tone) => {
  if (tone === 'danger') return 'material-symbols:do-not-disturb-on-rounded'
  if (tone === 'caution') return 'material-symbols:warning-rounded'
  if (tone === 'unavailable') return 'material-symbols:cloud-off-rounded'
  return 'material-symbols:check-circle-outline-rounded'
}
const weatherAdvice = computed(() => {
  if (weather.isLoading) {
    return {
      tone: 'normal',
      label: 'Checking weather',
      summary: 'Checking the latest weather for your starting area.',
      items: ['Please wait a moment before you leave.']
    }
  }
  if (weather.error || !weather.suitability) {
    return {
      tone: 'unavailable',
      label: 'Weather unavailable',
      summary: 'Weather advice is not available right now.',
      items: ['Please check the sky before leaving.', 'Bring water and sun or rain protection if needed.']
    }
  }
  const suitability = weather.suitability
  const items = Array.isArray(suitability.mainFactors) ? [...suitability.mainFactors] : []

  return {
    tone: weatherSuitabilityTone(suitability.label),
    label: suitability.uiLabel || suitability.label || 'Weather guidance ready',
    summary: suitability.summary || 'Weather guidance is ready for this trip.',
    items
  }
})
const weatherUpdatedText = computed(() => {
  const date = weather.suitability?.date
  if (!date) return weather.isLoading ? 'Updating now.' : formatTripDateLabel(tripDate.value)
  return formatTripDateLabel(tripDate.value, date)
})
const weatherFactorCards = computed(() => {
  return weatherAdvice.value.items.map((factor, index) => buildWeatherFactorCard(factor, index))
})
const readinessRouteAlerts = computed(() => [
  'This route may include comfort markers for benches, toilets, and drinking fountains.',
  'Tree canopy shade is displayed on the final route map when available.'
])
const readinessResult = computed(() => {
  return { title: 'Ready when you are', copy: 'Use this list as a gentle reminder. You can still decide what applies to you today.' }
})
const routeInstructions = computed(() => result.instructions.length ? result.instructions : [
  { text: `Start from ${selectedStart.value?.name || 'your start point'}.`, distanceMeters: 0 },
  { text: `Follow the highlighted route to ${result.destination?.name || 'your destination'}.`, distanceMeters: result.metrics.distanceMeters },
  { text: 'Check the route notes before leaving.', distanceMeters: null }
])
const canSeeRoute = computed(() => {
  const option = selectedRecommendation.value
  if (option) return option.route.length > 1
  return !!result.destination && result.route.length > 1
})
const showMapShoppingList = computed(() => destinationKind.value === 'grocery' && shoppingItems.value.length > 0)

const formatScore = (score) => Number.isFinite(Number(score)) ? `${Math.round(Number(score))}/100` : 'Score --'
const formatCompactScore = (score) => Number.isFinite(Number(score)) ? `${Math.round(Number(score))}` : '--'
const formatScorePart = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '--'
  return Number.isInteger(number) ? `${number}` : number.toFixed(1)
}
const ratingLabelFromScore = (score) => {
  const value = Number(score)
  if (!Number.isFinite(value)) return 'Not rated'
  if (value >= 80) return 'Excellent'
  if (value >= 68) return 'Good'
  if (value >= 55) return 'Fair'
  return 'Challenging'
}
const scoreTone = (score) => {
  const value = Number(score)
  if (value >= 80) return 'score-high'
  if (value >= 68) return 'score-medium'
  return 'score-low'
}
const formatMinutes = (minutes) => Number.isFinite(Number(minutes)) ? `${Math.max(1, Math.round(Number(minutes)))} min` : '-- min'
const formatDistance = (meters) => {
  const value = Number(meters)
  if (!Number.isFinite(value)) return '-- m'
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`
}
const friendlyErrorMessage = (fallback = 'Something went wrong. Please try again in a moment.') => fallback
const friendlyServiceErrorMessage = () => 'The service is busy right now. Please try again in a moment.'
const friendlySearchErrorMessage = () => 'Search is taking longer than expected. Please try again in a moment.'
const facilityBreakdownForRecommendation = (recommendation) => {
  const output = { bench: 0, drinking_fountain: 0, toilet: 0 }
  Object.entries(recommendation?.facilitySummary || {}).forEach(([key, value]) => {
    if (output[key] !== undefined && Number.isFinite(Number(value))) output[key] = Number(value)
  })
  if (Object.values(output).some((value) => value > 0)) return output
  ;(recommendation?.facilities || []).forEach((item) => {
    if (output[item.type] !== undefined) output[item.type] += 1
  })
  return output
}
const facilityTypeNames = (breakdown) => {
  const names = []
  if ((breakdown?.bench || 0) > 0) names.push('benches')
  if ((breakdown?.toilet || 0) > 0) names.push('toilets')
  if ((breakdown?.drinking_fountain || 0) > 0) names.push('drinking fountains')
  return names
}
const facilityCountText = (breakdown) => {
  const parts = []
  const benches = Number(breakdown?.bench || 0)
  const toilets = Number(breakdown?.toilet || 0)
  const fountains = Number(breakdown?.drinking_fountain || 0)
  if (benches > 0) parts.push(`${benches} bench${benches === 1 ? '' : 'es'}`)
  if (toilets > 0) parts.push(`${toilets} toilet${toilets === 1 ? '' : 's'}`)
  if (fountains > 0) parts.push(`${fountains} fountain${fountains === 1 ? '' : 's'}`)
  return parts.length ? parts.join(', ') : 'No nearby facilities counted'
}
const recommendationSummaryNotes = (recommendation) => {
  const notes = []
  const breakdown = facilityBreakdownForRecommendation(recommendation)
  const names = facilityTypeNames(breakdown)
  if (names.length) notes.push(`Along the way: ${names.join(', ')}`)
  const shade = Number(recommendation?.metrics?.shadeCoverage)
  if (Number.isFinite(shade)) notes.push(`${Math.round(shade * 100)}% tree shade`)
  return notes
}
const isMostRecommended = (recommendation) => {
  const score = Number(recommendation?.score)
  return Number.isFinite(score)
    && Number.isFinite(topRecommendationScore.value)
    && recommendation?.id === topRecommendationId.value
}
const isBestShade = (recommendation) => {
  const shade = Number(recommendation?.metrics?.shadeCoverage)
  return Number.isFinite(shade) && shade >= 0.2 && Number.isFinite(topShadeCoverage.value) && shade === topShadeCoverage.value
}
const shadeTierLabel = (recommendation) => {
  const shade = Number(recommendation?.metrics?.shadeCoverage)
  if (!Number.isFinite(shade)) return ''
  if (shade >= 0.65) return 'Best shade'
  if (shade >= 0.4) return 'Shaded route'
  if (shade >= 0.2) return 'Some shade'
  return 'Limited shade'
}
const recommendationBadges = (recommendation) => {
  const badges = []
  if (isMostRecommended(recommendation)) {
    badges.push({ label: 'Most Recommended', icon: 'material-symbols:star-rounded', tone: 'planner-rec-label-gold' })
  }
  if (isBestShade(recommendation)) {
    badges.push({ label: 'Best shade', icon: 'material-symbols:eco', tone: 'planner-rec-label-green' })
  }
  return badges
}
const recommendationFeatureChips = (recommendation) => {
  const chips = []
  const shadeLabel = shadeTierLabel(recommendation)
  if (shadeLabel) {
    chips.push({
      key: 'shade',
      label: shadeLabel,
      icon: 'material-symbols:park',
      tone: shadeLabel === 'Limited shade' ? 'planner-chip-warm' : 'planner-chip-shade'
    })
  }

  const breakdown = facilityBreakdownForRecommendation(recommendation)
  if (breakdown.bench > 0) {
    chips.push({ key: 'bench', label: `${breakdown.bench} Bench${breakdown.bench === 1 ? '' : 'es'}`, iconSrc: benchIcon, tone: 'planner-chip-bench' })
  }
  if (breakdown.drinking_fountain > 0) {
    chips.push({ key: 'drinking_fountain', label: `${breakdown.drinking_fountain} Fountain${breakdown.drinking_fountain === 1 ? '' : 's'}`, iconSrc: fountainIcon, tone: 'planner-chip-fountain' })
  }
  if (breakdown.toilet > 0) {
    chips.push({ key: 'toilet', label: `${breakdown.toilet} Toilet${breakdown.toilet === 1 ? '' : 's'}`, iconSrc: toiletIcon, tone: 'planner-chip-toilet' })
  }
  return chips
}
const recommendationShadeLabel = (recommendation) => {
  const shade = Number(recommendation?.metrics?.shadeCoverage)
  return Number.isFinite(shade) ? `${Math.round(shade * 100)}%` : 'Not available yet'
}
const recommendationTypeIconUrl = (recommendation) => {
  const type = recommendation?.destination?.type || selectedType.value || selectedSpecificDestination.value?.type
  return destinationTypes.find((item) => item.id === type)?.icon || selectedTypeIconUrl.value
}
const firstComfortNote = (recommendation) => recommendation.comfortNotes?.[0] || 'Comfort score based on walking time, shade, and nearby facilities'
const scrollTo = (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
const unlockStep = (id) => {
  maxReachableStep.value = Math.max(maxReachableStep.value, id)
}
const lockAfterStep = (id) => {
  maxReachableStep.value = Math.min(maxReachableStep.value, id)
}
const canNavigateToStep = (id) => id <= Math.min(maxReachableStep.value, 3)
const showStep = async (id) => {
  visibleStep.value = id
  isReadinessOpen.value = false
  isRouteView.value = false
  await nextTick()
  if (id === 1) scrollTo(startSectionEl.value)
  if (id === 2) scrollTo(destinationSectionEl.value)
  if (id === 3) {
    drawMiniMap()
    scrollTo(resultsSectionEl.value)
  }
}
const invalidateFromStartChange = () => {
  selectedType.value = ''
  selectedSpecificDestination.value = null
  destinationSearchResults.value = []
  clearPlanOnly()
  maxReachableStep.value = 2
}
const invalidateFromDestinationChange = () => {
  clearPlanOnly()
  lockAfterStep(2)
}
const samePlace = (left, right) => left?.id === right?.id
const pointInMapBounds = (place) => {
  const lat = Number(place?.lat)
  const lng = Number(place?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  const [[south, west], [north, east]] = MAP_VIEW_BOUNDS
  return lat >= south && lat <= north && lng >= west && lng <= east
}
const pointInRing = ([lng, lat], ring) => {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    const intersects = ((yi > lat) !== (yj > lat)) && (lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
    if (intersects) inside = !inside
  }
  return inside
}
const pointInPolygon = (point, rings) => {
  if (!rings?.length || !pointInRing(point, rings[0])) return false
  return !rings.slice(1).some((ring) => pointInRing(point, ring))
}
const geometryContainsPoint = (geometry, point) => {
  if (!geometry) return false
  if (geometry.type === 'Polygon') return pointInPolygon(point, geometry.coordinates)
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon))
  if (geometry.type === 'GeometryCollection') return geometry.geometries?.some((item) => geometryContainsPoint(item, point)) || false
  return false
}
const geoJsonContainsPlace = (geoJson, place) => {
  const lat = Number(place?.lat)
  const lng = Number(place?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
  const point = [lng, lat]
  if (geoJson?.type === 'FeatureCollection') {
    return geoJson.features?.some((feature) => geometryContainsPoint(feature.geometry, point)) || false
  }
  if (geoJson?.type === 'Feature') return geometryContainsPoint(geoJson.geometry, point)
  return geometryContainsPoint(geoJson, point)
}
const isPlaceInSupportedArea = async (place) => {
  if (!pointInMapBounds(place)) return false
  const boundary = await loadBoundaryGeoJson()
  return boundary ? geoJsonContainsPlace(boundary, place) : true
}
const setSelectedStart = async (place) => {
  startValidationMessage.value = ''
  const isSupported = await isPlaceInSupportedArea(place)
  if (!isSupported) {
    startValidationMessage.value = SUPPORTED_AREA_ERROR
    selectedStart.value = null
    selectedType.value = ''
    selectedSpecificDestination.value = null
    destinationSearchResults.value = []
    clearPlanOnly()
    maxReachableStep.value = 1
    return
  }
  if (!samePlace(selectedStart.value, place)) invalidateFromStartChange()
  selectedStart.value = place
  unlockStep(2)
  visibleStep.value = 2
  await nextTick()
  scrollTo(destinationSectionEl.value)
}

const routePlanEndpoint = () => ROUTE_SERVICE_URL
const placeSearchEndpoint = (text) => {
  const url = new URL(PLACE_SEARCH_URL, window.location.origin)
  url.searchParams.set('mode', 'text')
  url.searchParams.set('text', text)
  return url.toString()
}
const readJsonResponse = async (response) => {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}
const inferDestinationType = (place) => {
  const source = [
    place?.type,
    ...(Array.isArray(place?.categories) ? place.categories : [])
  ].join(' ').toLowerCase()
  if (source.includes('pharmacy') || source.includes('chemist')) return 'pharmacy'
  if (source.includes('clinic') || source.includes('medical') || source.includes('doctor') || source.includes('dental')) return 'clinic'
  if (source.includes('grocery') || source.includes('supermarket')) return 'grocery'
  if (source.includes('cafe') || source.includes('coffee')) return 'cafe'
  if (source.includes('park') || source.includes('garden')) return 'park'
  return ''
}
// Maps each backend POI category (from sqlite_service / OSM) to a Google
// Material Symbols icon name + short human label. Iconify loads each named
// icon on demand from the bundled material-symbols dataset.
//
// Browse / search icon names: https://fonts.google.com/icons (use the
// snake_case → kebab-case conversion that iconify expects)
const POI_CATEGORY_DISPLAY = {
  // Transport
  transit: { icon: 'material-symbols:train', label: 'Station' },
  // Food / drink
  cafe: { icon: 'material-symbols:local-cafe', label: 'Cafe' },
  restaurant: { icon: 'material-symbols:restaurant', label: 'Restaurant' },
  fast_food: { icon: 'material-symbols:fastfood', label: 'Fast food' },
  pub: { icon: 'material-symbols:sports-bar', label: 'Pub' },
  bar: { icon: 'material-symbols:local-bar', label: 'Bar' },
  ice_cream: { icon: 'material-symbols:icecream', label: 'Ice cream' },
  bakery: { icon: 'material-symbols:bakery-dining', label: 'Bakery' },
  butcher: { icon: 'material-symbols:storefront', label: 'Butcher' },
  greengrocer: { icon: 'material-symbols:grocery', label: 'Greengrocer' },
  // Health
  pharmacy: { icon: 'material-symbols:local-pharmacy', label: 'Pharmacy' },
  hospital: { icon: 'material-symbols:local-hospital', label: 'Hospital' },
  clinic: { icon: 'material-symbols:medical-services', label: 'Clinic' },
  dentist: { icon: 'material-symbols:dentistry', label: 'Dentist' },
  // Shops
  supermarket: { icon: 'material-symbols:shopping-cart', label: 'Supermarket' },
  convenience: { icon: 'material-symbols:storefront', label: 'Convenience' },
  mall: { icon: 'material-symbols:local-mall', label: 'Mall' },
  department_store: { icon: 'material-symbols:store', label: 'Department store' },
  clothes: { icon: 'material-symbols:checkroom', label: 'Clothing' },
  books: { icon: 'material-symbols:menu-book', label: 'Bookshop' },
  electronics: { icon: 'material-symbols:devices', label: 'Electronics' },
  hardware: { icon: 'material-symbols:hardware', label: 'Hardware' },
  florist: { icon: 'material-symbols:local-florist', label: 'Florist' },
  gift: { icon: 'material-symbols:redeem', label: 'Gift shop' },
  market: { icon: 'material-symbols:storefront', label: 'Market' },
  // Civic
  library: { icon: 'material-symbols:local-library', label: 'Library' },
  school: { icon: 'material-symbols:school', label: 'School' },
  university: { icon: 'material-symbols:school', label: 'University' },
  bank: { icon: 'material-symbols:account-balance', label: 'Bank' },
  atm: { icon: 'material-symbols:local-atm', label: 'ATM' },
  post_office: { icon: 'material-symbols:local-post-office', label: 'Post office' },
  place_of_worship: { icon: 'material-symbols:church', label: 'Place of worship' },
  community_centre: { icon: 'material-symbols:groups', label: 'Community centre' },
  // Leisure
  park: { icon: 'material-symbols:park', label: 'Park' },
  playground: { icon: 'material-symbols:swing', label: 'Playground' },
  fitness: { icon: 'material-symbols:fitness-center', label: 'Fitness centre' },
  swimming_pool: { icon: 'material-symbols:pool', label: 'Pool' },
  fountain: { icon: 'material-symbols:water-drop', label: 'Fountain' },
  // Tourism / culture
  attraction: { icon: 'material-symbols:attractions', label: 'Attraction' },
  museum: { icon: 'material-symbols:museum', label: 'Museum' },
  gallery: { icon: 'material-symbols:palette', label: 'Gallery' },
  hotel: { icon: 'material-symbols:hotel', label: 'Hotel' },
  viewpoint: { icon: 'material-symbols:landscape', label: 'Viewpoint' },
  tourist_info: { icon: 'material-symbols:info', label: 'Tourist info' },
  artwork: { icon: 'material-symbols:image', label: 'Artwork' },
  cinema: { icon: 'material-symbols:movie', label: 'Cinema' },
  theatre: { icon: 'material-symbols:theater-comedy', label: 'Theatre' },
}

const FALLBACK_CATEGORY_DISPLAY = { icon: 'material-symbols:location-on', label: 'Place' }

const categoryDisplay = (place) =>
  POI_CATEGORY_DISPLAY[place?.category] || FALLBACK_CATEGORY_DISPLAY

const placeTagValue = (place, ...keys) => {
  const tags = place?.tags && typeof place.tags === 'object' ? place.tags : {}
  for (const key of keys) {
    const value = place?.[key] ?? tags[key]
    if (value !== undefined && value !== null && String(value).trim()) return String(value)
  }
  return ''
}

const normalisePlaceSearchResults = (payload) => Array.isArray(payload?.places)
  ? payload.places
    .map((place, index) => {
      const lat = Number(place.lat ?? place.latitude)
      const lng = Number(place.lng ?? place.longitude)
      const categories = Array.isArray(place.categories) ? place.categories : []
      return {
        id: place.placeId || place.id || `${place.name || 'place'}-${lat}-${lng}-${index}`,
        placeId: place.placeId || place.id || null,
        name: place.name || 'Search result',
        address: place.address || place.formattedAddress || place.vicinity || '',
        type: inferDestinationType(place),
        category: categories[0] || place.resultType || '',
        categories,
        openingHours: placeTagValue(place, 'openingHours', 'opening_hours', 'hours'),
        website: placeTagValue(place, 'website'),
        phone: placeTagValue(place, 'phone'),
        wheelchair: placeTagValue(place, 'wheelchair'),
        cuisine: placeTagValue(place, 'cuisine'),
        brand: placeTagValue(place, 'brand'),
        operator: placeTagValue(place, 'operator'),
        lastUpdated: placeTagValue(place, 'lastUpdated', 'last_updated', 'updatedAt', 'updated_at', 'timestamp'),
        lat,
        lng
      }
    })
    .filter((place) => Number.isFinite(place.lat) && Number.isFinite(place.lng))
  : []
const searchPlaces = async (query) => {
  const response = await fetch(placeSearchEndpoint(query))
  const payload = await readJsonResponse(response)
  if (!response.ok) {
    throw new Error(friendlySearchErrorMessage())
  }
  return {
    places: normalisePlaceSearchResults(payload),
    outOfAreaCount: Number(payload?.outOfAreaCount) || 0,
  }
}
let weatherRequestKey = ''
const weatherSuitabilityApiEndpoint = weatherSuitabilityEndpoint(import.meta.env)
const setTripDate = (value) => {
  const nextTripDate = normaliseTripDate(value)
  if (tripDate.value === nextTripDate) return
  tripDate.value = nextTripDate
  weather.suitability = null
  weather.error = ''
  if (isReadinessOpen.value) {
    loadWeatherForStart()
  }
}
const loadWeatherForStart = async () => {
  const place = selectedStart.value
  if (!place?.lat || !place?.lng) return
  if (!weatherSuitabilityApiEndpoint) {
    weather.suitability = null
    weather.error = 'Weather advice is not configured right now.'
    return
  }
  const weatherRequest = buildWeatherRequest(tripDate.value, place)
  const requestKey = weatherRequest.key
  if (weatherRequestKey === requestKey && (weather.suitability || weather.isLoading)) return
  weatherRequestKey = requestKey
  weather.isLoading = true
  weather.error = ''
  try {
    const response = await fetch(weatherSuitabilityApiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weatherRequest.body)
    })
    const payload = await readJsonResponse(response)
    if (!response.ok) throw new Error('Weather advice is not available right now.')
    weather.suitability = payload || null
  } catch (error) {
    weather.suitability = null
    weather.error = 'Weather advice is not available right now.'
  } finally {
    weather.isLoading = false
  }
}
const addShoppingItem = () => {
  const text = shoppingInput.value.trim()
  if (!text) return
  shoppingItems.value.push({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text })
  shoppingInput.value = ''
}
const removeShoppingItem = (id) => {
  shoppingItems.value = shoppingItems.value.filter((item) => item.id !== id)
}
const normaliseBackendDestination = (destination, fallback = {}) => {
  const lat = Number(destination?.lat ?? destination?.latitude ?? fallback.lat)
  const lng = Number(destination?.lng ?? destination?.longitude ?? fallback.lng)
  const type = destination?.type || fallback.type || selectedType.value
  return {
    id: destination?.id || destination?.placeId || fallback.id || `${type || 'destination'}-${lat || 'lat'}-${lng || 'lng'}`,
    placeId: destination?.placeId || fallback.placeId || null,
    name: destination?.name || fallback.name || 'Recommended destination',
    type,
    address: destination?.address || destination?.vicinity || destination?.formatted || fallback.address || '',
    openingHours: destination?.openingHours || destination?.opening_hours || destination?.hours || fallback.openingHours || '',
    website: destination?.website || fallback.website || '',
    phone: destination?.phone || fallback.phone || '',
    wheelchair: destination?.wheelchair || fallback.wheelchair || '',
    cuisine: destination?.cuisine || fallback.cuisine || '',
    brand: destination?.brand || fallback.brand || '',
    operator: destination?.operator || fallback.operator || '',
    lastUpdated: destination?.lastUpdated || destination?.last_updated || destination?.updatedAt || destination?.updated_at || fallback.lastUpdated || '',
    lat,
    lng
  }
}
const normaliseBackendFacilities = (facilities) => Array.isArray(facilities)
  ? facilities
    .map((item, index) => ({
      id: item.id || item.facilityId || `facility-${index}`,
      type: String(item.type || item.facility_type || item.category || 'facility').trim().toLowerCase(),
      name: item.name || item.label || item.type || 'Route facility',
      lat: Number(item.lat ?? item.latitude),
      lng: Number(item.lng ?? item.longitude),
      distanceMeters: Number.isFinite(Number(item.distanceMeters ?? item.distanceToRouteMeters)) ? Number(item.distanceMeters ?? item.distanceToRouteMeters) : null,
      conditionRating: Number.isFinite(Number(item.conditionRating)) ? Number(item.conditionRating) : null,
      wheelchair: item.wheelchair,
      lastUpdated: item.lastUpdated
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
  : []
const normaliseBackendRoute = (route) => Array.isArray(route)
  ? route
    .map((point) => Array.isArray(point) ? [Number(point[0]), Number(point[1])] : [Number(point.lng ?? point.longitude), Number(point.lat ?? point.latitude)])
    .filter(([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat))
  : []
const buildBackendComfortNotes = (facilities, routeSummary) => {
  const notes = []
  const benches = facilities.filter((item) => item.type === 'bench').length
  const toilets = facilities.filter((item) => item.type === 'toilet').length
  const fountains = facilities.filter((item) => item.type === 'drinking_fountain').length
  const names = []
  if (benches) names.push('benches')
  if (toilets) names.push('toilets')
  if (fountains) names.push('drinking fountains')
  if (names.length) notes.push(`Along the way: ${names.join(', ')}`)
  const shade = Number(routeSummary?.shadeCoverage)
  if (Number.isFinite(shade)) notes.push(`${Math.round(shade * 100)}% tree shade`)
  return notes
}
const buildBackendRecommendation = (payload, index = 0) => {
  const fallbackDestination = destinationMode.value === 'specific' ? selectedSpecificDestination.value : {}
  const destination = normaliseBackendDestination(payload.destination, fallbackDestination)
  const facilities = normaliseBackendFacilities(payload.facilities)
  const routeSummary = payload.routeSummary || {}
  const distanceMeters = Number(routeSummary.walkingDistanceMeters ?? destination.distanceMeters)
  const durationMinutes = Number(routeSummary.elderlyWalkingDurationMinutes ?? routeSummary.walkingDurationMinutes ?? (Number(routeSummary.walkingDurationSeconds) / 60))
  return {
    id: payload.optionId || destination.id || `route-option-${index + 1}`,
    optionId: payload.optionId ?? index + 1,
    destination,
    route: normaliseBackendRoute(payload.route),
    facilities,
    facilitySummary: payload.facilitySummary || {},
    metrics: {
      distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
      durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : null,
      shadeCoverage: Number.isFinite(Number(routeSummary.shadeCoverage)) ? Number(routeSummary.shadeCoverage) : null,
      preferShade: Boolean(routeSummary.preferShade)
    },
    score: Number.isFinite(Number(payload.score)) ? Number(payload.score) : null,
    routeRating: Number.isFinite(Number(payload.routeRating)) ? Number(payload.routeRating) : null,
    ratingLabel: payload.ratingLabel || '',
    ratingReason: payload.ratingReason || '',
    scoreBreakdown: payload.scoreBreakdown || {},
    comfortNotes: buildBackendComfortNotes(facilities, routeSummary),
    instructions: []
  }
}
const buildRecommendationsFromPayload = (payload) => {
  if (DEBUG_PLANNER) {
    console.info('[Shadeo route response]', {
      mode: payload?.mode,
      eligible: payload?.eligible,
      optionCount: Array.isArray(payload?.options) ? payload.options.length : null,
      routeLength: Array.isArray(payload?.route) ? payload.route.length : null,
      optionRouteLengths: Array.isArray(payload?.options) ? payload.options.map((option) => option?.route?.length || 0) : []
    })
  }
  if (payload?.eligible === false) return []
  if (Array.isArray(payload?.options)) {
    return payload.options
      .filter((option) => option?.eligible !== false)
      .map((option, index) => buildBackendRecommendation(option, index))
      .filter((option) => option.destination && option.route.length > 1)
  }
  if (payload?.destination) return [buildBackendRecommendation(payload, 0)].filter((option) => option.route.length > 1)
  return []
}
const fetchBackendPlan = async () => {
  const start = {
    name: selectedStart.value.name,
    lat: selectedStart.value.lat,
    lng: selectedStart.value.lng
  }
  const body = destinationMode.value === 'specific'
    ? {
        mode: 'custom_destination',
        start,
        destination: {
          name: selectedSpecificDestination.value.name,
          lat: selectedSpecificDestination.value.lat,
          lng: selectedSpecificDestination.value.lng
        },
        preferShade: preferShade.value
      }
    : {
        mode: 'destination_type',
        start,
        destinationType: selectedType.value,
        preferShade: preferShade.value
      }
  const response = await fetch(routePlanEndpoint(), {
    method: 'POST',
    body: JSON.stringify(body)
  })
  const payload = await readJsonResponse(response)
  if (!response.ok) {
    throw new Error(friendlyServiceErrorMessage())
  }
  return payload
}

const useMyLocation = async () => {
  startMode.value = 'current'
  startValidationMessage.value = ''
  if (!navigator.geolocation) {
    startValidationMessage.value = 'Current location is not available in this browser. Please search for a starting point.'
    return
  }
  isLocating.value = true
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      })
    })
    await setSelectedStart({
      id: 'current-location',
      name: 'Current location',
      address: 'Detected by your browser',
      lat: position.coords.latitude,
      lng: position.coords.longitude
    })
    startSearchResults.value = []
  } catch {
    startValidationMessage.value = 'Current location could not be detected. Please search for a starting point.'
  } finally {
    isLocating.value = false
  }
}
const runStartSearch = async () => {
  if (!startQuery.value) return
  isSearchingStart.value = true
  startValidationMessage.value = ''
  try {
    const result = await searchPlaces(startQuery.value)
    startSearchResults.value = result.places
    startOutOfAreaCount.value = result.outOfAreaCount
    if (!result.places.length) {
      startValidationMessage.value = result.outOfAreaCount > 0
        ? 'No matches in Central Melbourne. Try a closer place or a more specific address.'
        : 'No matching places were returned. Try a more specific address or landmark.'
    }
  } catch (error) {
    startSearchResults.value = []
    startOutOfAreaCount.value = 0
    startValidationMessage.value = friendlySearchErrorMessage()
  } finally {
    isSearchingStart.value = false
  }
}
const selectStartPlace = async (place) => {
  await setSelectedStart(place)
}
const setDestinationMode = (mode) => {
  if (destinationMode.value === mode) return
  destinationMode.value = mode
  destinationValidationMessage.value = ''
  selectedSpecificDestination.value = null
  destinationSearchResults.value = []
  selectedType.value = ''
  invalidateFromDestinationChange()
}
const chooseDestinationType = (id) => {
  if (selectedType.value === id && destinationMode.value === 'category') return
  destinationValidationMessage.value = ''
  selectedType.value = id
  selectedSpecificDestination.value = null
  invalidateFromDestinationChange()
}
const runDestinationSearch = async () => {
  if (!destinationQuery.value) return
  isSearchingDestination.value = true
  destinationValidationMessage.value = ''
  try {
    const result = await searchPlaces(destinationQuery.value)
    destinationSearchResults.value = result.places
    destinationOutOfAreaCount.value = result.outOfAreaCount
    if (!result.places.length) {
      destinationValidationMessage.value = result.outOfAreaCount > 0
        ? 'No matches in Central Melbourne. Try a closer place or a more specific place name.'
        : 'No matching destinations were returned. Try a more specific place name.'
    }
  } catch (error) {
    destinationSearchResults.value = []
    destinationOutOfAreaCount.value = 0
    destinationValidationMessage.value = friendlySearchErrorMessage()
  } finally {
    isSearchingDestination.value = false
  }
}

const SEARCH_DEBOUNCE_MS = 400
const SEARCH_MIN_CHARS = 3
let startSearchDebounce = null
let destinationSearchDebounce = null

watch(startQuery, (value) => {
  if (startSearchDebounce) {
    clearTimeout(startSearchDebounce)
    startSearchDebounce = null
  }
  if (!value || value.trim().length < SEARCH_MIN_CHARS) {
    startSearchResults.value = []
    return
  }
  startSearchDebounce = setTimeout(() => {
    runStartSearch()
  }, SEARCH_DEBOUNCE_MS)
})

watch(destinationQuery, (value) => {
  if (destinationSearchDebounce) {
    clearTimeout(destinationSearchDebounce)
    destinationSearchDebounce = null
  }
  if (!value || value.trim().length < SEARCH_MIN_CHARS) {
    destinationSearchResults.value = []
    return
  }
  destinationSearchDebounce = setTimeout(() => {
    runDestinationSearch()
  }, SEARCH_DEBOUNCE_MS)
})

onBeforeUnmount(() => {
  if (startSearchDebounce) clearTimeout(startSearchDebounce)
  if (destinationSearchDebounce) clearTimeout(destinationSearchDebounce)
})
const selectSpecificDestination = async (place) => {
  if (samePlace(selectedSpecificDestination.value, place)) return
  destinationValidationMessage.value = ''
  const isSupported = await isPlaceInSupportedArea(place)
  if (!isSupported) {
    destinationValidationMessage.value = SUPPORTED_AREA_ERROR
    selectedSpecificDestination.value = null
    selectedType.value = ''
    invalidateFromDestinationChange()
    return
  }
  selectedSpecificDestination.value = place
  selectedType.value = place.type || ''
  invalidateFromDestinationChange()
}

const clearPlanOnly = () => {
  canopyRequestId += 1
  hasSearched.value = false
  recommendations.value = []
  highlightedRecommendationId.value = ''
  planError.value = ''
  Object.assign(result, {
    destination: null,
    facilities: [],
    route: [],
    metrics: { distanceMeters: null, durationMinutes: null },
    score: null,
    routeRating: null,
    ratingLabel: '',
    ratingReason: '',
    scoreBreakdown: {},
    facilitySummary: {},
    canopy: null,
    comfortNotes: [],
    instructions: []
  })
  stopRouteDashAnimation()
  destroyMiniMap()
}

const requestPlan = async () => {
  if (!canFindRecommendations.value) return
  startValidationMessage.value = ''
  destinationValidationMessage.value = ''
  if (!await isPlaceInSupportedArea(selectedStart.value)) {
    startValidationMessage.value = SUPPORTED_AREA_ERROR
    visibleStep.value = 1
    lockAfterStep(1)
    return
  }
  if (destinationMode.value === 'specific' && !await isPlaceInSupportedArea(selectedSpecificDestination.value)) {
    destinationValidationMessage.value = SUPPORTED_AREA_ERROR
    lockAfterStep(2)
    return
  }
  clearPlanOnly()
  unlockStep(3)
  visibleStep.value = 3
  isLoadingPlan.value = true
  hasSearched.value = true
  try {
    const payload = await fetchBackendPlan()
    if (payload?.eligible === false) {
      planError.value = 'This route is outside our current walking range.'
      recommendations.value = []
    } else {
      const backendRecommendations = buildRecommendationsFromPayload(payload)
      const supportedRecommendations = []
      for (const recommendation of backendRecommendations) {
        if (await isPlaceInSupportedArea(recommendation.destination)) supportedRecommendations.push(recommendation)
      }
      if (!supportedRecommendations.length) {
        planError.value = 'We could not find a suitable walking option for this start point and destination.'
      }
      recommendations.value = supportedRecommendations
      highlightedRecommendationId.value = visibleRecommendations.value[0]?.id || ''
    }
  } catch (error) {
    planError.value = friendlyServiceErrorMessage()
    recommendations.value = []
  } finally {
    isLoadingPlan.value = false
  }
  await nextTick()
  drawMiniMap()
  scrollTo(resultsSectionEl.value)
}
const normaliseCanopyGeoJson = (payload) => {
  if (payload?.type !== 'FeatureCollection' || !Array.isArray(payload.features)) return emptyFeatureCollection()
  return {
    type: 'FeatureCollection',
    features: payload.features.filter((feature) => feature?.type === 'Feature' && feature.geometry)
  }
}
let canopyRequestId = 0
const loadCanopyForRoute = async (route) => {
  const routePoints = normaliseBackendRoute(route)
  const requestId = ++canopyRequestId
  result.canopy = null
  if (routePoints.length < 2) return
  try {
    const response = await fetch(CANOPY_QUERY_URL, {
      method: 'POST',
      body: JSON.stringify({ routePoints })
    })
    const payload = await readJsonResponse(response)
    if (!response.ok) throw new Error(payload.error || payload.message || `Canopy request failed (${response.status})`)
    if (requestId === canopyRequestId) {
      result.canopy = normaliseCanopyGeoJson(payload)
      if (DEBUG_PLANNER) console.info('[Shadeo canopy response]', { featureCount: result.canopy.features.length })
      if (map) requestAnimationFrame(() => drawRouteMap())
    }
  } catch {
    if (requestId === canopyRequestId) {
      result.canopy = emptyFeatureCollection()
      if (DEBUG_PLANNER) console.info('[Shadeo canopy unavailable]')
      if (map) requestAnimationFrame(() => drawRouteMap())
    }
  }
}
const applySelectedRecommendation = (recommendation) => {
  if (!recommendation) canopyRequestId += 1
  Object.assign(result, {
    destination: recommendation?.destination || null,
    facilities: recommendation?.facilities || [],
    route: recommendation?.route || [],
    metrics: recommendation?.metrics || { distanceMeters: null, durationMinutes: null },
    score: recommendation?.score ?? null,
    routeRating: recommendation?.routeRating ?? null,
    ratingLabel: recommendation?.ratingLabel || '',
    ratingReason: recommendation?.ratingReason || '',
    scoreBreakdown: recommendation?.scoreBreakdown || {},
    facilitySummary: recommendation?.facilitySummary || {},
    canopy: null,
    comfortNotes: recommendation?.comfortNotes || [],
    instructions: recommendation?.instructions || []
  })
}
const selectRecommendation = async (recommendation) => {
  if (DEBUG_PLANNER) {
    console.info('[Shadeo selected route]', {
      id: recommendation?.id,
      destination: recommendation?.destination?.name,
      routeLength: recommendation?.route?.length || 0,
      first: recommendation?.route?.[0],
      last: recommendation?.route?.at?.(-1)
    })
  }
  applySelectedRecommendation(recommendation)
  highlightedRecommendationId.value = recommendation?.id || ''
  unlockStep(4)
  destroyMiniMap()
  await nextTick()
  drawMiniMap()
  loadCanopyForRoute(recommendation?.route || [])
  scrollTo(resultsSectionEl.value)
}
const openRecommendationDetails = (recommendation) => {
  highlightedRecommendationId.value = recommendation?.id || ''
  isDetailOpen.value = true
}
const closeRecommendationDetails = () => {
  isDetailOpen.value = false
}
const backToRecommendations = async () => {
  applySelectedRecommendation(null)
  lockAfterStep(3)
  visibleStep.value = 3
  destroyMiniMap()
  await nextTick()
  drawMiniMap()
}
const highlightRecommendation = async (recommendation) => {
  highlightedRecommendationId.value = recommendation?.id || ''
  await nextTick()
  drawMiniMap({ focusSelected: true })
}

const loadBoundaryGeoJson = async () => {
  if (!boundaryGeoJsonPromise) {
    boundaryGeoJsonPromise = fetch(MUNICIPAL_BOUNDARY_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Boundary GeoJSON failed (${response.status})`)
        return response.json()
      })
      .catch(() => null)
  }
  return boundaryGeoJsonPromise
}
const startMarkerHtml = (label = 'You') => (
  '<div class="rv-pin-start">' +
  '<svg width="16" height="16" viewBox="0 0 24 24" fill="white">' +
  '<circle cx="12" cy="4" r="2.5"/>' +
  '<path d="M10 8.5c-1.1 0-2 .9-2 2v4h2v5h4v-5h2v-4c0-1.1-.9-2-2-2h-4z"/>' +
  '</svg></div>' +
  `<div class="rv-pin-label rv-pin-label-start">${label}</div>`
)
const destinationMarkerHtml = (label = selectedTypeLabel.value) => (
  '<div class="rv-pin-dest">' +
  `<img src="${selectedTypeIconUrl.value}" width="22" height="22"/>` +
  '</div>' +
  `<div class="rv-pin-label rv-pin-label-dest">${label}</div>`
)
const facilityMarkerHtml = (item) => {
  if (item.type === 'bench') {
    return `<div class="rv-pin-fac rv-pin-fac-compact rv-pin-bench"><img src="${benchIcon}" width="14" height="14" style="filter:invert(1)"/></div>`
  }
  if (item.type === 'toilet') {
    return `<div class="rv-pin-fac rv-pin-fac-compact rv-pin-toilet"><img src="${toiletIcon}" width="14" height="14" style="filter:invert(1)"/></div>`
  }
  if (item.type === 'drinking_fountain') {
    return `<div class="rv-pin-fac rv-pin-fac-compact rv-pin-fountain"><img src="${fountainIcon}" width="14" height="14" style="filter:invert(1)"/></div>`
  }
  return ''
}

const absoluteMapAssetUrl = (url) => {
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
  const prefix = url.startsWith('/') ? '' : '/'
  return `${window.location.origin}${prefix}${url}`
}
const loadMapStyle = async () => {
  if (!mapStylePromise) {
    mapStylePromise = fetch(MAP_STYLE_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Map style failed (${response.status})`)
        return response.json()
      })
      .then((style) => ({
        ...style,
        glyphs: absoluteMapAssetUrl(MAP_GLYPHS_URL),
        sprite: absoluteMapAssetUrl(MAP_SPRITE_URL),
        sources: {
          ...style.sources,
          openmaptiles: {
            type: 'vector',
            url: `pmtiles://${PMTILES_URL}`,
            minzoom: 0,
            maxzoom: PMTILES_MAX_DATA_ZOOM,
            bounds: [144.875, -37.895, 145.055, -37.735]
          }
        }
      }))
  }
  return mapStylePromise
}
const mapMaxBounds = () => [[MAP_VIEW_BOUNDS[0][1], MAP_VIEW_BOUNDS[0][0]], [MAP_VIEW_BOUNDS[1][1], MAP_VIEW_BOUNDS[1][0]]]
const emptyFeatureCollection = () => ({ type: 'FeatureCollection', features: [] })
const routeFeatureCollection = (lngLatLine) => ({
  type: 'FeatureCollection',
  features: lngLatLine.length > 1
    ? [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: lngLatLine }
      }]
    : []
})
const toRadians = (degrees) => degrees * Math.PI / 180
const distanceBetweenLngLat = ([lng1, lat1], [lng2, lat2]) => {
  const radius = 6371000
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
const normaliseRouteDirection = (line) => {
  const start = selectedStart.value || DEFAULT_MAP_CENTER
  if (line.length < 2 || start?.lng == null || start?.lat == null) return line
  const startPoint = [start.lng, start.lat]
  const distanceToFirst = distanceBetweenLngLat(startPoint, line[0])
  const distanceToLast = distanceBetweenLngLat(startPoint, line[line.length - 1])
  return distanceToLast < distanceToFirst ? [...line].reverse() : line
}
const routeConnectorFeatureCollection = () => {
  const features = []
  if (result.route.length > 1) {
    const start = selectedStart.value || DEFAULT_MAP_CENTER
    const directedRoute = normaliseRouteDirection(result.route.map(([lng, lat]) => [lng, lat]))
    const routeStart = directedRoute[0]
    const routeEnd = directedRoute[directedRoute.length - 1]
    if (Number.isFinite(start.lng) && Number.isFinite(start.lat)) {
      features.push({
        type: 'Feature',
        properties: { role: 'start' },
        geometry: { type: 'LineString', coordinates: [[start.lng, start.lat], routeStart] }
      })
    }
    if (result.destination?.lng != null && result.destination?.lat != null) {
      features.push({
        type: 'Feature',
        properties: { role: 'destination' },
        geometry: { type: 'LineString', coordinates: [routeEnd, [result.destination.lng, result.destination.lat]] }
      })
    }
  }
  return { type: 'FeatureCollection', features }
}
const interpolateLngLat = ([lng1, lat1], [lng2, lat2], ratio) => [
  lng1 + (lng2 - lng1) * ratio,
  lat1 + (lat2 - lat1) * ratio
]
const routeLengthMeters = (line) => line.slice(1).reduce((total, point, index) => total + distanceBetweenLngLat(line[index], point), 0)
const routeSegmentBetween = (line, startMeters, endMeters) => {
  const segment = []
  let walked = 0
  for (let index = 1; index < line.length; index += 1) {
    const from = line[index - 1]
    const to = line[index]
    const distance = distanceBetweenLngLat(from, to)
    const segmentStart = walked
    const segmentEnd = walked + distance

    if (segmentEnd >= startMeters && segmentStart <= endMeters && distance > 0) {
      const localStart = Math.max(startMeters, segmentStart)
      const localEnd = Math.min(endMeters, segmentEnd)
      const startPoint = interpolateLngLat(from, to, (localStart - segmentStart) / distance)
      const endPoint = interpolateLngLat(from, to, (localEnd - segmentStart) / distance)
      if (!segment.length) segment.push(startPoint)
      segment.push(endPoint)
    }
    walked = segmentEnd
    if (walked > endMeters) break
  }
  return segment.length > 1 ? segment : null
}
const routeDashFeatureCollection = (line, offsetMeters = 0) => {
  const dashMeters = 11
  const gapMeters = 12
  const cycleMeters = dashMeters + gapMeters
  const totalMeters = routeLengthMeters(line)
  if (line.length < 2 || totalMeters <= 0) return emptyFeatureCollection()

  const features = []
  for (let cursor = offsetMeters - cycleMeters; cursor < totalMeters; cursor += cycleMeters) {
    const start = Math.max(0, cursor)
    const end = Math.min(totalMeters, cursor + dashMeters)
    if (end <= 0 || end <= start) continue
    const segment = routeSegmentBetween(line, start, end)
    if (segment) {
      features.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: segment }
      })
    }
  }
  return { type: 'FeatureCollection', features }
}
const ensureGeoJsonSource = (targetMap, sourceId) => {
  if (!targetMap.getSource(sourceId)) {
    targetMap.addSource(sourceId, { type: 'geojson', data: emptyFeatureCollection() })
  }
  return targetMap.getSource(sourceId)
}
const ensureRouteLayers = (targetMap, sourceId) => {
  ensureGeoJsonSource(targetMap, sourceId)
  ensureGeoJsonSource(targetMap, `${sourceId}-flow`)
  ensureGeoJsonSource(targetMap, `${sourceId}-connectors`)
  if (!targetMap.getLayer(`${sourceId}-halo`)) {
    targetMap.addLayer({
      id: `${sourceId}-halo`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#e8efe6',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 8, 18, 13],
        'line-opacity': 0.92
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
  if (!targetMap.getLayer(`${sourceId}-line`)) {
    targetMap.addLayer({
      id: `${sourceId}-line`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#b9d7b3',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 5, 18, 8],
        'line-opacity': 0.82
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
  if (!targetMap.getLayer(`${sourceId}-flow-line`)) {
    targetMap.addLayer({
      id: `${sourceId}-flow-line`,
      type: 'line',
      source: `${sourceId}-flow`,
      paint: {
        'line-color': '#34a853',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 18, 5],
        'line-opacity': 0.96
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
  if (!targetMap.getLayer(`${sourceId}-connectors-line`)) {
    targetMap.addLayer({
      id: `${sourceId}-connectors-line`,
      type: 'line',
      source: `${sourceId}-connectors`,
      paint: {
        'line-color': '#1b7f3a',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 3, 18, 5],
        'line-opacity': 0.9,
        'line-dasharray': [1.2, 1.6]
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
}
const startRouteDashAnimation = () => {
  if (routeDashFrame) return
  const tick = () => {
    const line = result.route.length > 1 ? normaliseRouteDirection(result.route.map(([lng, lat]) => [lng, lat])) : []
    const flowData = routeDashFeatureCollection(line, routeDashOffset)
    if (miniMap?.getSource('planner-mini-route-flow')) {
      miniMap.getSource('planner-mini-route-flow').setData(flowData)
    }
    if (map?.getSource('planner-route-flow')) {
      map.getSource('planner-route-flow').setData(flowData)
    }
    routeDashOffset = (routeDashOffset + 1.6) % 23
    routeDashFrame = window.setTimeout(tick, 80)
  }
  tick()
}
const stopRouteDashAnimation = () => {
  if (!routeDashFrame) return
  window.clearTimeout(routeDashFrame)
  routeDashFrame = null
}
const moveBoundaryLayersToTop = (targetMap) => {
  ;['planner-boundary-fill', 'planner-boundary-halo', 'planner-boundary-line'].forEach((layerId) => {
    if (targetMap.getLayer(layerId)) targetMap.moveLayer(layerId)
  })
}
const addBoundaryLayer = async (targetMap) => {
  if (!targetMap) return
  if (!targetMap.isStyleLoaded()) {
    targetMap.once('idle', () => addBoundaryLayer(targetMap))
    return
  }
  const boundary = await loadBoundaryGeoJson()
  if (!boundary || !targetMap?.isStyleLoaded()) return
  if (!targetMap.getSource('planner-boundary')) {
    targetMap.addSource('planner-boundary', { type: 'geojson', data: boundary })
  }
  if (!targetMap.getLayer('planner-boundary-fill')) {
    targetMap.addLayer({
      id: 'planner-boundary-fill',
      type: 'fill',
      source: 'planner-boundary',
      paint: {
        'fill-color': '#74b86f',
        'fill-opacity': 0.07
      }
    })
  }
  if (!targetMap.getLayer('planner-boundary-halo')) {
    targetMap.addLayer({
      id: 'planner-boundary-halo',
      type: 'line',
      source: 'planner-boundary',
      paint: {
        'line-color': '#ffffff',
        'line-width': 9,
        'line-opacity': 0.9
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
  if (!targetMap.getLayer('planner-boundary-line')) {
    targetMap.addLayer({
      id: 'planner-boundary-line',
      type: 'line',
      source: 'planner-boundary',
      paint: {
        'line-color': '#155d25',
        'line-width': 5,
        'line-opacity': 0.98
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
  moveBoundaryLayersToTop(targetMap)
}
const createPlannerMap = async (container, options = {}) => {
  const style = await loadMapStyle()
  const targetMap = new maplibregl.Map({
    container,
    style,
    center: [DEFAULT_MAP_CENTER.lng, DEFAULT_MAP_CENTER.lat],
    zoom: options.zoom || 13,
    minZoom: MAP_MIN_ZOOM,
    maxZoom: MAP_MAX_ZOOM,
    maxBounds: mapMaxBounds(),
    attributionControl: true,
    scrollZoom: options.scrollZoom ?? false,
    dragRotate: false,
    pitchWithRotate: false
  })
  targetMap.touchZoomRotate.disableRotation()
  targetMap.on('load', () => {
    addBoundaryLayer(targetMap)
    options.onLoad?.()
  })
  return targetMap
}
const clearMarkers = (markers) => {
  markers.splice(0).forEach((marker) => marker.remove())
}
const addHtmlMarker = (targetMap, markers, lngLat, html, options = {}) => {
  const el = document.createElement('div')
  el.className = 'planner-maplibre-marker'
  if (options.className) el.classList.add(options.className)
  if (options.zIndex != null) el.style.zIndex = String(options.zIndex)
  el.innerHTML = html
  const marker = new maplibregl.Marker({
    element: el,
    anchor: options.anchor || 'bottom',
    offset: options.offset || [0, 0]
  })
    .setLngLat(lngLat)
    .addTo(targetMap)
  if (options.title) marker.getElement().title = options.title
  markers.push(marker)
}
const facilityFeatureCollection = () => ({
  type: 'FeatureCollection',
  features: result.facilities
    .filter((item) => item.lat != null && item.lng != null)
    .map((item) => ({
      type: 'Feature',
      properties: {
        type: item.type,
        name: item.name || item.type
      },
      geometry: {
        type: 'Point',
        coordinates: [item.lng, item.lat]
      }
    }))
})
const ensureFacilityLayers = (targetMap, sourceId) => {
  ensureGeoJsonSource(targetMap, sourceId)
  if (!targetMap.getLayer(`${sourceId}-shadow`)) {
    targetMap.addLayer({
      id: `${sourceId}-shadow`,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 18, 9],
        'circle-color': 'rgba(16, 33, 22, 0.22)',
        'circle-blur': 0.65,
        'circle-translate': [1, 2]
      }
    })
  }
  if (!targetMap.getLayer(`${sourceId}-circle`)) {
    targetMap.addLayer({
      id: `${sourceId}-circle`,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 7, 18, 11],
        'circle-color': [
          'match',
          ['get', 'type'],
          'bench', '#7cb342',
          'toilet', '#2196f3',
          'drinking_fountain', '#00bcd4',
          '#7cb342'
        ],
        'circle-stroke-color': [
          'match',
          ['get', 'type'],
          'bench', '#558b2f',
          'toilet', '#1565c0',
          'drinking_fountain', '#0097a7',
          '#558b2f'
        ],
        'circle-stroke-width': 2,
        'circle-opacity': 0.95
      }
    })
  }
  if (!targetMap.getLayer(`${sourceId}-icon`)) {
    targetMap.addLayer({
      id: `${sourceId}-icon`,
      type: 'symbol',
      source: sourceId,
      layout: {
        'text-field': [
          'match',
          ['get', 'type'],
          'bench', 'B',
          'toilet', 'T',
          'drinking_fountain', 'W',
          'F'
        ],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 18, 12],
        'text-font': ['Noto Sans Bold'],
        'text-allow-overlap': true,
        'text-ignore-placement': true
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0, 0, 0, 0.16)',
        'text-halo-width': 0.6
      }
    })
  }
}
const drawFacilityLayer = (targetMap, sourceId) => {
  if (!targetMap?.isStyleLoaded()) return
  ensureFacilityLayers(targetMap, sourceId)
  targetMap.getSource(sourceId)?.setData(facilityFeatureCollection())
}
const moveRouteLayersToTop = (targetMap, sourceId) => {
  ;[`${sourceId}-connectors-line`, `${sourceId}-halo`, `${sourceId}-line`, `${sourceId}-flow-line`].forEach((layerId) => {
    if (targetMap.getLayer(layerId)) targetMap.moveLayer(layerId)
  })
}
const moveCanopyLayersBelowRoute = (targetMap, sourceId) => {
  const beforeLayer = targetMap.getLayer('planner-route-halo')
    ? 'planner-route-halo'
    : targetMap.getLayer('planner-boundary-line')
      ? 'planner-boundary-line'
      : undefined
  ;[`${sourceId}-fill`, `${sourceId}-line`].forEach((layerId) => {
    if (targetMap.getLayer(layerId)) targetMap.moveLayer(layerId, beforeLayer)
  })
}
const moveFacilityLayersToTop = (targetMap, sourceId) => {
  ;[`${sourceId}-shadow`, `${sourceId}-circle`, `${sourceId}-icon`].forEach((layerId) => {
    if (targetMap.getLayer(layerId)) targetMap.moveLayer(layerId)
  })
}
const canopyFeatureCollection = () => result.canopy || emptyFeatureCollection()
const ensureCanopyLayers = (targetMap, sourceId) => {
  ensureGeoJsonSource(targetMap, sourceId)
  if (!targetMap.getLayer(`${sourceId}-fill`)) {
    targetMap.addLayer({
      id: `${sourceId}-fill`,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#7fc97a',
        'fill-opacity': 0.36
      }
    })
  }
  if (!targetMap.getLayer(`${sourceId}-line`)) {
    targetMap.addLayer({
      id: `${sourceId}-line`,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#2f7d3f',
        'line-width': 1.2,
        'line-opacity': 0.55
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' }
    })
  }
}
const drawCanopyLayer = (targetMap, sourceId) => {
  if (!targetMap?.getStyle()) return
  try {
    ensureCanopyLayers(targetMap, sourceId)
    const canopyData = canopyFeatureCollection()
    targetMap.getSource(sourceId)?.setData(canopyData)
    moveCanopyLayersBelowRoute(targetMap, sourceId)
    if (DEBUG_PLANNER) {
      console.info('[Shadeo draw canopy]', {
        featureCount: canopyData.features.length,
        styleLoaded: targetMap.isStyleLoaded(),
        sourceExists: !!targetMap.getSource(sourceId),
        layers: ['fill', 'line'].map((suffix) => ({
          id: `${sourceId}-${suffix}`,
          exists: !!targetMap.getLayer(`${sourceId}-${suffix}`)
        }))
      })
    }
  } catch (error) {
    console.error('[Shadeo draw canopy failed]', error)
  }
}
const fitMapToPoints = (targetMap, lngLatPoints, padding, maxZoom = MAP_MAX_ZOOM) => {
  if (!targetMap || !lngLatPoints.length) return
  const bounds = lngLatPoints.reduce(
    (mapBounds, point) => mapBounds.extend(point),
    new maplibregl.LngLatBounds(lngLatPoints[0], lngLatPoints[0])
  )
  targetMap.fitBounds(bounds, { padding, maxZoom, duration: 0 })
}
const maxCoordinateSpan = (lngLatPoints) => {
  if (!lngLatPoints.length) return 0
  const lngs = lngLatPoints.map((point) => Number(point[0])).filter(Number.isFinite)
  const lats = lngLatPoints.map((point) => Number(point[1])).filter(Number.isFinite)
  if (!lngs.length || !lats.length) return 0
  return Math.max(
    Math.max(...lngs) - Math.min(...lngs),
    Math.max(...lats) - Math.min(...lats)
  )
}
const miniMapFitMaxZoom = (lngLatPoints) => {
  const span = maxCoordinateSpan(lngLatPoints)
  if (span <= 0.003) return 15.9
  if (span <= 0.006) return 15.5
  if (span <= 0.012) return 15
  return 14.2
}
const drawRouteLine = (targetMap, sourceId, lngLatLine) => {
  if (DEBUG_PLANNER && sourceId === 'planner-route') {
    console.info('[Shadeo draw route start]', {
      pointCount: lngLatLine.length,
      styleLoaded: !!targetMap?.isStyleLoaded(),
      first: lngLatLine[0],
      last: lngLatLine.at?.(-1)
    })
  }
  if (!targetMap?.getStyle()) return
  try {
    ensureRouteLayers(targetMap, sourceId)
    const routeData = routeFeatureCollection(lngLatLine)
    targetMap.getSource(sourceId)?.setData(routeData)
    targetMap.getSource(`${sourceId}-flow`)?.setData(routeDashFeatureCollection(lngLatLine, routeDashOffset))
    targetMap.getSource(`${sourceId}-connectors`)?.setData(routeConnectorFeatureCollection())
    if (DEBUG_PLANNER && sourceId === 'planner-route') {
      console.info('[Shadeo draw route]', {
        pointCount: lngLatLine.length,
        featureCount: routeData.features.length,
        first: lngLatLine[0],
        last: lngLatLine.at?.(-1),
        sourceExists: !!targetMap.getSource(sourceId),
        flowSourceExists: !!targetMap.getSource(`${sourceId}-flow`),
        connectorSourceExists: !!targetMap.getSource(`${sourceId}-connectors`),
        renderedFeatureCount: targetMap.querySourceFeatures(sourceId).length,
        mapCenter: targetMap.getCenter().toArray(),
        zoom: targetMap.getZoom(),
        paint: targetMap.getLayer(`${sourceId}-line`) ? {
          color: targetMap.getPaintProperty(`${sourceId}-line`, 'line-color'),
          width: targetMap.getPaintProperty(`${sourceId}-line`, 'line-width'),
          opacity: targetMap.getPaintProperty(`${sourceId}-line`, 'line-opacity')
        } : null,
        layoutVisibility: targetMap.getLayer(`${sourceId}-line`)
          ? targetMap.getLayoutProperty(`${sourceId}-line`, 'visibility') || 'visible'
          : null,
        layers: ['halo', 'line', 'flow-line', 'connectors-line'].map((suffix) => ({
          id: `${sourceId}-${suffix}`,
          exists: !!targetMap.getLayer(`${sourceId}-${suffix}`)
        }))
      })
    }
  } catch (error) {
    console.error('[Shadeo draw route failed]', error)
    return
  }
  moveBoundaryLayersToTop(targetMap)
  moveRouteLayersToTop(targetMap, sourceId)
  if (lngLatLine.length > 1) {
    startRouteDashAnimation()
  } else {
    targetMap.getSource(`${sourceId}-flow`)?.setData(emptyFeatureCollection())
  }
}
const drawMarkerSet = (targetMap, markers, lngLatBounds, includeFacilities = false) => {
  if (!targetMap) return
  clearMarkers(markers)
  const start = selectedStart.value || DEFAULT_MAP_CENTER
  addHtmlMarker(
    targetMap,
    markers,
    [start.lng, start.lat],
    includeFacilities ? startMarkerHtml() : '<div class="rv-pin-start"></div><div class="rv-pin-label rv-pin-label-start">Start</div>',
    { zIndex: 20 }
  )
  lngLatBounds.push([start.lng, start.lat])

  const destinations = (targetMap === miniMap && visibleRecommendations.value.length
    ? visibleRecommendations.value
    : hasDestination.value ? [result] : recommendations.value)
    .map((item, index) => ({ item, index }))
  const orderedDestinations = [
    ...destinations.filter(({ item }) => !(!hasDestination.value && highlightedRecommendationId.value === item.id)),
    ...destinations.filter(({ item }) => !hasDestination.value && highlightedRecommendationId.value === item.id)
  ]
  orderedDestinations.forEach(({ item, index }) => {
    const destination = item.destination
    const isHighlighted = !hasDestination.value && highlightedRecommendationId.value === item.id
    const pinClass = isHighlighted ? 'rv-pin-dest is-highlighted' : 'rv-pin-dest'
    const destHtml = hasDestination.value
      ? destinationMarkerHtml(selectedTypeLabel.value)
      : `<div class="${pinClass}">${index + 1}</div><div class="rv-pin-label rv-pin-label-dest">${destination.name}</div>`
    addHtmlMarker(targetMap, markers, [destination.lng, destination.lat], destHtml, {
      className: isHighlighted ? 'planner-marker-highlighted' : '',
      zIndex: isHighlighted ? 80 : hasDestination.value ? 50 : 30 + index
    })
    lngLatBounds.push([destination.lng, destination.lat])
  })

  if (!includeFacilities) return
  const facilitySourceId = targetMap === miniMap ? 'planner-mini-facilities' : 'planner-facilities'
  drawFacilityLayer(targetMap, facilitySourceId)
  moveBoundaryLayersToTop(targetMap)
  moveFacilityLayersToTop(targetMap, facilitySourceId)
  result.facilities.forEach((item) => {
    if (item.lat == null || item.lng == null) return
    const html = facilityMarkerHtml(item)
    if (html) addHtmlMarker(targetMap, markers, [item.lng, item.lat], html, { anchor: 'center', title: item.name })
    lngLatBounds.push([item.lng, item.lat])
  })
}
const ensureMiniMap = async () => {
  if (miniMap || !miniMapEl.value) return
  miniMap = await createPlannerMap(miniMapEl.value, { zoom: 13, onLoad: drawMiniMap })
  miniMap.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
}
const drawMiniMap = async (options = {}) => {
  if (!recommendations.value.length && !hasDestination.value) return
  await ensureMiniMap()
  if (!miniMap?.isStyleLoaded()) return
  const focusSelected = options?.focusSelected === true
  const lngLatBounds = []
  drawMarkerSet(miniMap, miniMapMarkers, lngLatBounds, false)
  const focusedDestination = selectedRecommendation.value?.destination
  if (focusSelected && focusedDestination && Number.isFinite(Number(focusedDestination.lng)) && Number.isFinite(Number(focusedDestination.lat))) {
    miniMap.easeTo({
      center: [focusedDestination.lng, focusedDestination.lat],
      zoom: Math.min(MAP_MAX_ZOOM, 16.8),
      padding: { top: 0, bottom: 0, left: 0, right: 0 },
      duration: 260
    })
  } else {
    fitMapToPoints(
      miniMap,
      lngLatBounds,
      { top: 44, bottom: 58, left: 44, right: 44 },
      miniMapFitMaxZoom(lngLatBounds)
    )
  }
  requestAnimationFrame(() => miniMap?.resize())
}
const destroyMiniMap = () => {
  clearMarkers(miniMapMarkers)
  miniMap?.remove()
  miniMap = null
}
const ensureMap = async () => {
  if (map || !mapEl.value) return
  const start = selectedStart.value || DEFAULT_MAP_CENTER
  map = await createPlannerMap(mapEl.value, { zoom: 14, scrollZoom: true, onLoad: drawRouteMap })
  map.setCenter([start.lng, start.lat])
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
}
const drawRouteMap = async () => {
  await ensureMap()
  if (!map) return
  if (DEBUG_PLANNER) {
    console.info('[Shadeo draw route map entry]', {
      hasMapElement: !!mapEl.value,
      styleLoaded: map.isStyleLoaded(),
      routeLength: result.route.length,
      destination: result.destination?.name
    })
  }
  if (!map.isStyleLoaded()) {
    map.once('load', () => drawRouteMap())
    map.once('idle', () => drawRouteMap())
    return
  }
  const lngLatBounds = []
  let line = []
  try {
    line = result.route.length > 1
      ? normaliseRouteDirection(result.route.map(([lng, lat]) => [lng, lat]))
      : []
  } catch (error) {
    console.error('[Shadeo route normalise failed]', error)
    line = []
  }
  drawRouteLine(map, 'planner-route', line)
  if (line.length) lngLatBounds.push(...line)
  try {
    drawCanopyLayer(map, 'planner-canopy')
    moveRouteLayersToTop(map, 'planner-route')
  } catch (error) {
    console.error('[Shadeo draw canopy failed]', error)
  }
  try {
    drawMarkerSet(map, routeMapMarkers, lngLatBounds, true)
  } catch (error) {
    console.error('[Shadeo draw markers failed]', error)
  }
  fitMapToPoints(map, lngLatBounds, 48)
  requestAnimationFrame(() => map?.resize())
}

const openReadinessCheck = () => {
  if (!hasDestination.value) return
  unlockStep(4)
  destroyMiniMap()
  isReadinessPromptOpen.value = false
  isReadinessOpen.value = true
  loadWeatherForStart()
}
const openRouteReadinessPrompt = () => {
  const recommendation = selectedRecommendation.value
  if (!recommendation) return
  applySelectedRecommendation(recommendation)
  loadCanopyForRoute(recommendation.route || [])
  unlockStep(4)
  isDetailOpen.value = false
  isReadinessPromptOpen.value = true
}
const readReadinessChecklist = () => {
  if (!hasDestination.value) return
  isReadinessPromptOpen.value = false
  isReadinessOpen.value = true
  destroyMiniMap()
  loadWeatherForStart()
}
const skipReadinessAndOpenRoute = async () => {
  isReadinessPromptOpen.value = false
  await confirmReadyToGo()
}
const closeReadinessToResults = async () => {
  isReadinessPromptOpen.value = false
  isReadinessOpen.value = false
  visibleStep.value = 3
  destroyMiniMap()
  await nextTick()
  await drawMiniMap()
  requestAnimationFrame(() => {
    miniMap?.resize()
    drawMiniMap()
  })
  scrollTo(resultsSectionEl.value)
}
const confirmReadyToGo = async () => {
  if (!hasDestination.value) return
  isReadinessPromptOpen.value = false
  isReadinessOpen.value = false
  unlockStep(4)
  isRouteView.value = true
  window.scrollTo(0, 0)
  await nextTick()
  await ensureMap()
  await drawRouteMap()
}
const exportItinerary = () => {
  const text = [
    'Shadeo Itinerary',
    `Start: ${selectedStart.value?.name || 'Not selected'}`,
    `Destination: ${result.destination?.name || 'Not selected'}`,
    `Route score: ${formatScore(result.score)}`,
    `Distance: ${formatDistance(result.metrics.distanceMeters)}`,
    `Walking time: ${formatMinutes(result.metrics.durationMinutes)}`,
    '',
    'Route steps:',
    ...routeInstructions.value.map((step, index) => `${index + 1}. ${step.text} ${formatDistance(step.distanceMeters)}`)
  ].join('\n')
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'shadeo-itinerary.txt'
  link.click()
  URL.revokeObjectURL(url)
}
const jumpToStep = async (id) => {
  if (!canNavigateToStep(id)) return
  if (id <= 3) {
    await showStep(id)
    return
  }
  if (id === 4) {
    isRouteView.value = false
    openReadinessCheck()
    return
  }
  if (id === 5) {
    await confirmReadyToGo()
  }
}

watch(hasDestination, async () => {
  await nextTick()
  drawMiniMap()
})
watch(recommendationSort, async () => {
  await nextTick()
  drawMiniMap()
})
watch(
  () => isReadinessOpen.value,
  async (open) => {
    if (open || isRouteView.value || !hasDestination.value) return
    await nextTick()
    requestAnimationFrame(() => {
      miniMap?.resize()
      drawMiniMap()
    })
  }
)
watch(
  () => isRouteView.value,
  (visible) => {
    if (!visible) {
      stopRouteDashAnimation()
      clearMarkers(routeMapMarkers)
      map?.remove()
      map = null
    }
  }
)
onBeforeUnmount(() => {
  stopRouteDashAnimation()
  clearMarkers(routeMapMarkers)
  map?.remove()
  destroyMiniMap()
  maplibregl.removeProtocol('pmtiles')
})
</script>

<style>
.route-planner-page {
  min-height: 100vh;
  color: var(--brand-ink);
  background:
    radial-gradient(circle at 18% 4%, rgba(155, 224, 111, 0.16), transparent 30%),
    linear-gradient(180deg, var(--brand-paper-white) 0%, var(--brand-paper) 100%);
}

.route-planner-page button,
.route-planner-page input {
  font: inherit;
}

.planner-scene,
.planner-scene-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

.planner-scene {
  background:
    linear-gradient(90deg, rgba(35, 45, 39, 0.028) 1px, transparent 1px),
    linear-gradient(180deg, rgba(35, 45, 39, 0.022) 1px, transparent 1px);
  background-size: 52px 52px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.55), transparent 68%);
}

.planner-scene-overlay {
  background:
    radial-gradient(circle at 82% 16%, rgba(168, 212, 226, 0.18), transparent 30%),
    linear-gradient(180deg, rgba(251, 250, 247, 0.46), transparent 42%);
}

.planner-step-nav {
  position: fixed;
  top: 50%;
  left: clamp(14px, 1.6vw, 28px);
  z-index: 40;
  width: 168px;
  margin: 0;
  transform: translateY(-50%);
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.planner-step-nav button {
  min-height: 74px;
  border: 1px solid var(--brand-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--brand-ink-muted);
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  justify-items: start;
  gap: 12px;
  padding: 12px 14px;
  text-align: left;
  font-weight: 900;
  box-shadow: 0 16px 36px -30px rgba(35, 45, 39, 0.46);
  backdrop-filter: blur(14px);
  transition:
    transform var(--d-fast) ease,
    background-color var(--d-fast) ease,
    border-color var(--d-fast) ease;
}

.planner-step-nav button:not(:disabled):hover {
  transform: translateY(-2px);
  border-color: rgba(35, 45, 39, 0.22);
}

.planner-step-nav button.active,
.planner-step-nav button.done {
  background: #263028;
  color: #fff;
  border-color: rgba(35, 45, 39, 0.18);
}

.planner-step-nav button.done {
  background: #f2d28a;
  color: #2b2415;
}

.planner-step-nav button.locked {
  opacity: 0.42;
}

.planner-step-nav span {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(35, 45, 39, 0.08);
  font-size: 0.95rem;
}

.planner-step-nav small {
  font-size: 1rem;
  line-height: 1.15;
  white-space: normal;
}

.planner-shell {
  position: relative;
  z-index: 1;
  width: min(100% - var(--gutter) * 2, 1180px);
  margin: 0 auto;
}

@media (min-width: 1180px) {
  .planner-shell {
    width: min(calc(100% - 230px - var(--gutter)), 1280px);
    margin-left: max(210px, calc((100vw - 1280px) / 2 + 80px));
    margin-right: auto;
  }
}

.planner-flow-shell {
  padding: calc(var(--nav-h) + 52px) 0 84px;
}

.planner-flow-hero {
  min-height: 28vh;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 16px;
  padding: clamp(18px, 3.6vw, 46px) 0 54px;
  text-align: center;
}

.planner-flow-kicker,
.planner-section-headline p,
.planner-readiness-head p,
.rv-dest-type-label,
.rv-section h3 {
  color: #2d451f;
  font-size: 0.92rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.planner-flow-hero h1 {
  max-width: min(100%, 20ch);
  font-family: var(--font-body);
  font-size: clamp(3rem, 4vw, 3.5rem);
  font-weight: 950;
  line-height: var(--brand-lh-heading);
  letter-spacing: 0;
}

.planner-flow-hero > p:not(.planner-flow-kicker) {
  max-width: 58ch;
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-lead);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
}

.planner-card,
.planner-readiness-modal {
  border: 1px solid var(--brand-line);
  border-radius: 28px;
  background: rgba(252, 247, 235, 0.84);
  box-shadow: var(--brand-shadow-panel);
  backdrop-filter: blur(18px) saturate(130%);
}

.planner-step-card,
.planner-result-loading-card {
  max-width: 900px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 42px);
}

.planner-card-heading,
.planner-detail-title-row,
.planner-readiness-head,
.rv-dest-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.planner-card-heading > span {
  width: 54px;
  height: 54px;
  flex: 0 0 54px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: #f2d28a;
  color: #2b2415;
  font-size: 1.45rem;
  font-weight: 950;
}

.planner-card-heading h2,
.planner-section-headline h3,
.planner-detail-title-row h3,
.planner-readiness-head h2,
.planner-result-loading-card h3 {
  font-family: var(--font-body);
  font-weight: 950;
  letter-spacing: 0;
  color: var(--brand-ink-soft);
}

.planner-card-heading h2 {
  font-size: clamp(2.625rem, 3vw, 3rem);
  line-height: 1.08;
}

.planner-readiness-head h2 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  line-height: 1.06;
}

.planner-card-heading p,
.planner-panel-instruction,
.planner-search-box p,
.planner-selection-note,
.planner-section-headline > span,
.planner-result-loading-card p,
.planner-check-intro,
.planner-readiness-result span {
  color: var(--brand-ink-muted);
  font-size: var(--brand-fs-body);
  font-weight: 650;
  line-height: var(--brand-lh-copy);
}

.planner-choice-list,
.planner-search-results,
.planner-recommendation-list,
.planner-comfort-notes,
.planner-shopping-list,
.rv-legend-list {
  display: grid;
  gap: 12px;
}

.planner-route-panel .rv-legend-list {
  grid-template-columns: 1fr;
  gap: 5px;
}

.planner-choice-list,
.planner-search-box,
.planner-search-results,
.planner-category-panel,
.planner-flow-action,
.planner-detail-facilities,
.planner-readiness-block,
.planner-readiness-result {
  margin-top: 22px;
}

.planner-choice-row,
.planner-type-card,
.planner-search-results button,
.planner-destination-card,
.planner-readiness-block,
.planner-check-row,
.planner-shopping-list li,
.rv-stat-card,
.rv-fac-card {
  border: 1px solid var(--brand-line-soft);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.64);
}

.planner-choice-row,
.planner-search-results button,
.planner-destination-card,
.planner-check-row,
.planner-shopping-list li {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;
  text-align: left;
  color: var(--brand-ink-soft);
}

.planner-choice-row:hover,
.planner-choice-row.active,
.planner-search-results button:hover,
.planner-search-results button.active,
.planner-destination-card:hover,
.planner-destination-card.is-selected,
.planner-type-card:hover,
.planner-type-card.active {
  border-color: rgba(159, 100, 22, 0.34);
  background: rgba(255, 239, 196, 0.82);
}

.planner-choice-icon,
.planner-type-icon,
.planner-detail-title-row > img,
.rv-dest-icon-wrap {
  flex: 0 0 auto;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: rgba(168, 212, 226, 0.28);
}

.planner-type-icon svg {
  width: 32px;
  height: 32px;
  color: rgb(70, 100, 130);
}

.planner-choice-icon img,
.planner-type-icon img,
.planner-detail-title-row img,
.rv-dest-icon-wrap img,
.planner-destination-metrics img,
.planner-metric-chip img,
.rv-fac-card img {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.planner-choice-row strong,
.planner-search-results strong,
.planner-destination-body strong {
  display: block;
  color: var(--brand-ink-soft);
  font-size: 1.15rem;
  font-weight: 950;
  line-height: 1.25;
}

.planner-choice-row small,
.planner-search-results small,
.planner-destination-address {
  display: block;
  color: var(--brand-ink-muted);
  font-size: 1rem;
  line-height: 1.45;
}

.planner-search-hint {
  margin: 8px 4px 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(180, 180, 180, 0.08);
  color: var(--brand-ink-muted);
  font-size: 0.85rem;
  line-height: 1.4;
  font-style: italic;
}

.planner-shade-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(168, 212, 226, 0.16);
  border: 1px solid rgba(78, 130, 146, 0.26);
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}

.planner-shade-toggle:hover {
  background: rgba(168, 212, 226, 0.24);
  border-color: rgba(78, 130, 146, 0.45);
}

.planner-shade-toggle input[type="checkbox"] {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #4e8292;
}

.planner-shade-toggle-icon {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  color: #4e8292;
}

.planner-shade-toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.planner-shade-toggle-text strong {
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 700;
}

.planner-shade-toggle-text small {
  color: var(--brand-ink-muted);
  font-size: 0.8rem;
}

.planner-metric-chip-shade {
  background: rgba(168, 212, 226, 0.16);
  color: #315c69;
}

.planner-metric-chip-shade svg {
  width: 18px;
  height: 18px;
  color: #4e8292;
}

.planner-search-results button {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  text-align: left;
}

.planner-search-result-icon {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  margin-top: 2px;
  color: var(--brand-ink-soft);
  /* Iconify renders SVG inline; this sets stroke / fill via currentColor */
}

.planner-search-result-text {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.planner-search-result-tag {
  display: inline-block;
  align-self: flex-start;
  margin-top: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(120, 180, 120, 0.18);
  color: var(--brand-ink-soft);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.planner-search-box {
  display: grid;
  gap: 10px;
}

.planner-search-box label {
  color: var(--brand-ink-soft);
  font-size: 1rem;
  font-weight: 900;
}

.planner-search-line,
.planner-shopping-form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.planner-search-line input,
.planner-shopping-form input {
  min-height: 58px;
  width: 100%;
  border: 1px solid var(--brand-line);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  color: var(--brand-ink-soft);
  padding: 0 18px;
  font-size: var(--brand-fs-control);
}

.route-planner-page .btn,
.planner-map-picker-close,
.planner-back-btn,
.planner-step-back-btn,
.planner-view-details,
.planner-shopping-form button {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: var(--r-pill);
  border: 1px solid var(--brand-line);
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink-soft);
  padding: 0 20px;
  font-weight: 950;
  transition:
    transform var(--d-fast) ease,
    background-color var(--d-fast) ease;
}

.route-planner-page .btn-primary,
.planner-ready-btn,
.planner-view-details,
.planner-shopping-form button {
  border-color: #263028;
  background: #263028;
  color: #fff;
}

.planner-back-btn,
.planner-step-back-btn,
.planner-return-btn {
  border-color: rgba(151, 68, 49, 0.18);
  background: #f5d8cf;
  color: #743927;
}

.planner-back-btn:hover,
.planner-step-back-btn:hover,
.planner-return-btn:hover {
  background: #efc9bd;
}

.route-planner-page .btn:hover,
.planner-map-picker-close:hover,
.planner-back-btn:hover,
.planner-step-back-btn:hover,
.planner-view-details:hover,
.planner-shopping-form button:hover {
  transform: translateY(-1px);
}

.route-planner-page .btn:disabled,
.route-planner-page button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  transform: none;
}

.planner-step-back-btn {
  margin-bottom: 18px;
}

.planner-segmented {
  margin-top: 24px;
  padding: 5px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
  border-radius: 18px;
  background: rgba(35, 45, 39, 0.06);
}

.planner-segmented button {
  min-height: 54px;
  border-radius: 14px;
  color: var(--brand-ink-muted);
  font-weight: 950;
}

.planner-segmented button.active {
  background: var(--brand-paper-white);
  color: var(--brand-ink-soft);
  box-shadow: 0 12px 24px -22px rgba(35, 45, 39, 0.45);
}

.planner-type-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.planner-type-card {
  min-height: 138px;
  padding: 18px 12px;
  display: grid;
  place-items: center;
  gap: 12px;
  color: var(--brand-ink-soft);
}

.planner-type-name {
  font-size: 1.08rem;
  font-weight: 950;
}

.planner-selection-note {
  width: fit-content;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 239, 196, 0.82);
}

.planner-selection-note-error {
  background: rgba(215, 114, 82, 0.14);
  color: #7b3426;
}

.planner-flow-action {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.planner-result-anchor {
  margin-top: 10px;
}

.planner-spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(155, 224, 111, 0.32);
  border-top-color: #263028;
  display: inline-block;
  animation: planner-spin 0.85s linear infinite;
}

@keyframes planner-spin {
  to { transform: rotate(360deg); }
}

.planner-result-loading-card {
  text-align: center;
  display: grid;
  justify-items: center;
  gap: 12px;
}

.planner-recommendation-layout {
  padding: clamp(18px, 2.4vw, 24px);
  display: grid;
  grid-template-columns: minmax(430px, 0.95fr) minmax(440px, 1.05fr);
  gap: 18px;
  align-items: stretch;
}

.planner-section-headline {
  display: grid;
  gap: 6px;
  margin-bottom: 10px;
}

.planner-section-headline h3 {
  font-size: clamp(1.75rem, 2.6vw, 2.4rem);
}

.planner-result-toolbar {
  margin-bottom: 2px;
  display: flex;
  justify-content: flex-end;
}

.planner-result-toolbar label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--brand-ink-soft);
  font-size: 0.98rem;
  font-weight: 1000;
}

.planner-result-toolbar select {
  min-height: 38px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  color: var(--brand-ink-soft);
  padding: 0 34px 0 12px;
  font-weight: 900;
}

.planner-destination-card {
  cursor: pointer;
  align-items: flex-start;
  padding: 14px 16px;
  gap: 12px;
}

.planner-destination-card.is-top-result {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.86), rgba(255, 248, 224, 0.78));
  border-color: rgba(239, 166, 43, 0.54);
  box-shadow: 0 18px 42px -34px rgba(159, 100, 22, 0.7);
}

.planner-destination-rank {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: #263028;
  color: #fff;
  font-size: 1rem;
  font-weight: 950;
}

.planner-destination-body {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  column-gap: 12px;
  row-gap: 5px;
  align-items: start;
}

.planner-destination-topline,
.planner-destination-metrics,
.planner-tag-row,
.planner-metric-row,
.planner-summary-actions,
.planner-result-actions,
.rv-stats-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.planner-destination-topline {
  grid-column: 1 / -1;
}

.planner-result-actions {
  margin-top: 10px;
  justify-content: flex-start;
}

.planner-result-actions .btn {
  min-width: 148px;
}

.planner-destination-main {
  grid-column: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.planner-destination-main strong {
  color: var(--brand-ink-soft);
  font-size: clamp(1.18rem, 1.65vw, 1.52rem);
  font-weight: 950;
  line-height: 1.14;
  overflow-wrap: anywhere;
}

.planner-rec-label,
.planner-score-badge,
.planner-tag-row em {
  border-radius: var(--r-pill);
  padding: 6px 10px;
  background: rgba(35, 45, 39, 0.08);
  color: var(--brand-ink-soft);
  font-size: 0.82rem;
  font-style: normal;
  font-weight: 950;
  line-height: 1;
}

.planner-rec-label,
.planner-tag-row em,
.planner-score-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.planner-rec-label svg,
.planner-tag-row em svg {
  width: 16px;
  height: 16px;
}

.planner-rec-label-gold {
  background: linear-gradient(90deg, #fff1c8, #f5cf7c);
  color: #6d4a13;
}

.planner-rec-label-green {
  background: #e7f1df;
  color: #3e6b3f;
}

.planner-card-score {
  grid-column: 2;
  grid-row: 2 / span 3;
  display: grid;
  justify-items: center;
  gap: 5px;
}

.planner-destination-metrics,
.planner-feature-chip-row {
  grid-column: 1;
}

.planner-view-details {
  grid-column: 1 / -1;
}

.planner-card-score > span:first-child {
  width: 86px;
  color: var(--brand-ink-soft);
  font-size: 0.7rem;
  font-weight: 1000;
  line-height: 1;
  text-align: center;
  text-transform: uppercase;
}

.planner-score-badge-large {
  width: 86px;
  min-height: 58px;
  align-self: start;
  justify-content: center;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border-radius: 16px;
  text-align: center;
}

.planner-score-badge-large strong {
  font-size: 1.55rem;
  line-height: 1;
}

.planner-score-badge-large small {
  color: inherit;
  font-size: 0.76rem;
  font-weight: 950;
  line-height: 1.1;
}

.planner-score-badge.score-high {
  background: rgba(153, 207, 149, 0.32);
  color: #2e6337;
}

.planner-score-badge.score-medium {
  background: rgba(239, 166, 43, 0.2);
  color: #7a5718;
}

.planner-score-badge.score-low {
  background: rgba(215, 114, 82, 0.18);
  color: #7b3426;
}

.planner-feature-chip-row em {
  min-height: 31px;
  padding: 6px 10px;
  font-size: 0.82rem;
}

.planner-feature-chip-row img {
  width: 18px;
  height: 18px;
}

.planner-chip-shade {
  background: #e9f3e4;
  color: #3f693c;
}

.planner-chip-warm {
  background: rgba(239, 166, 43, 0.18);
  color: #735018;
}

.planner-chip-bench {
  background: #f2eddf;
  color: #62512d;
}

.planner-chip-fountain {
  background: #e4f3f6;
  color: #2d6570;
}

.planner-chip-toilet {
  background: #e7eef8;
  color: #345c83;
}

.planner-destination-metrics span,
.planner-metric-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--brand-ink-muted);
  font-weight: 850;
}

.planner-mini-map-panel {
  min-height: 540px;
  overflow: hidden;
  border: 1px solid var(--brand-line);
  border-radius: 24px;
  background: #d9ddd8;
  display: grid;
  grid-template-rows: auto 1fr;
}

.planner-mini-map-head {
  display: grid;
  gap: 3px;
  padding: 16px 18px;
  background: rgba(252, 247, 235, 0.92);
}

.planner-mini-map-head strong {
  color: var(--brand-ink-soft);
  font-size: 1.05rem;
  font-weight: 950;
}

.planner-mini-map-head span {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  line-height: 1.35;
}

.planner-mini-map {
  min-height: 460px;
}

.planner-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 88;
  padding: clamp(16px, 4vw, 34px);
  display: grid;
  place-items: center;
  background: rgba(16, 19, 15, 0.28);
  backdrop-filter: blur(10px);
}

.planner-detail-modal {
  position: relative;
  width: min(100%, 720px);
  max-height: min(90vh, 820px);
  overflow: auto;
  padding: clamp(22px, 4vw, 34px);
}

.planner-modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--brand-line);
  background: rgba(255, 255, 255, 0.86);
  color: var(--brand-ink-soft);
  font-weight: 950;
}

.planner-detail-grid {
  margin-top: 22px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.planner-detail-grid .planner-metric-chip {
  justify-content: center;
}

.planner-destination-metrics {
  margin-top: 0;
}

.planner-feature-chip-row {
  margin-top: -1px;
}

.planner-detail-rating {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.58);
  display: grid;
  gap: 14px;
}

.planner-detail-rating-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.planner-detail-rating-head div {
  display: grid;
  gap: 4px;
}

.planner-detail-rating-head span,
.planner-score-row small {
  color: var(--brand-ink-muted);
  font-size: 0.98rem;
  font-weight: 850;
  line-height: 1.35;
}

.planner-detail-rating-head span {
  font-size: 0.82rem;
}

.planner-detail-rating-head strong {
  color: var(--brand-ink-soft);
  font-size: 1.35rem;
  font-weight: 950;
  line-height: 1.1;
}

.planner-detail-rating-head em {
  min-height: 42px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  display: inline-flex;
  align-items: center;
  background: rgba(35, 45, 39, 0.08);
  color: var(--brand-ink-soft);
  font-style: normal;
  font-weight: 950;
}

.planner-detail-rating.score-high .planner-detail-rating-head em {
  background: rgba(168, 212, 226, 0.38);
  color: #254f5d;
}

.planner-detail-rating.score-medium .planner-detail-rating-head em {
  background: var(--brand-gold);
}

.planner-detail-rating.score-low .planner-detail-rating-head em {
  background: rgba(215, 114, 82, 0.18);
  color: #7b3426;
}

.planner-detail-rating p {
  margin: 0;
  color: var(--brand-ink-muted);
  font-weight: 750;
  line-height: 1.45;
}

.planner-score-breakdown {
  display: grid;
  gap: 12px;
}

.planner-score-row {
  display: grid;
  gap: 6px;
}

.planner-score-row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.planner-score-row-top span,
.planner-score-row-top strong {
  color: var(--brand-ink-soft);
  font-weight: 950;
}

.planner-score-bar {
  height: 9px;
  overflow: hidden;
  border-radius: var(--r-pill);
  background: rgba(35, 45, 39, 0.08);
}

.planner-score-bar span {
  height: 100%;
  border-radius: inherit;
  display: block;
  background: #5f9f73;
}

.planner-score-row:nth-child(2) .planner-score-bar span {
  background: #6b95a8;
}

.planner-score-row:nth-child(3) .planner-score-bar span {
  background: #d69b3a;
}

.planner-detail-info-list {
  margin-top: 18px;
  display: grid;
  gap: 10px;
}

.planner-detail-info-list > div {
  display: grid;
  gap: 3px;
  padding: 14px 16px;
  border: 1px solid var(--brand-line-soft);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.66);
}

.planner-detail-info-list strong {
  color: var(--brand-ink-soft);
  font-weight: 950;
}

.planner-detail-info-list span,
.planner-detail-info-list a {
  color: var(--brand-ink-muted);
  font-weight: 700;
  line-height: 1.4;
  min-height: 1.4em;
  overflow-wrap: anywhere;
}

.planner-detail-info-list a {
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.planner-detail-facility-grid {
  margin-top: 14px;
}

.planner-detail-layout {
  grid-template-columns: minmax(0, 0.82fr) minmax(360px, 1.18fr);
}

.planner-detail-panel {
  display: grid;
  align-content: start;
  gap: 20px;
}

.planner-detail-title-row > img {
  padding: 14px;
}

.planner-detail-title-row p {
  color: var(--brand-ink-muted);
  font-size: 0.98rem;
  font-weight: 750;
}

.planner-detail-title-row h3 {
  font-size: clamp(1.55rem, 2.4vw, 2.25rem);
  line-height: 1.12;
}

.planner-metric-chip {
  min-height: 58px;
  padding: 10px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid var(--brand-line-soft);
}

.planner-metric-chip strong,
.planner-metric-chip em,
.planner-metric-chip small {
  color: var(--brand-ink-soft);
  font-style: normal;
  font-weight: 950;
}

.planner-readiness-backdrop {
  position: fixed;
  inset: 0;
  z-index: 90;
  padding: clamp(16px, 4vw, 34px);
  display: grid;
  place-items: center;
  background: rgba(16, 19, 15, 0.3);
  backdrop-filter: blur(12px);
}

.planner-readiness-modal {
  position: relative;
  width: min(100%, 880px);
  max-height: min(92vh, 980px);
  overflow: auto;
  padding: clamp(22px, 4vw, 36px);
}

.planner-readiness-prompt {
  width: min(100%, 760px);
  overflow: auto;
  padding: clamp(28px, 4vw, 40px);
}

.planner-readiness-prompt .planner-readiness-head h2 {
  max-width: 18ch;
  font-size: clamp(1.65rem, 3.6vw, 2.65rem);
  line-height: 1.12;
}

.planner-readiness-prompt .planner-readiness-advice {
  margin-top: 22px;
  padding: 18px 22px;
  font-size: clamp(1.05rem, 2vw, 1.28rem);
  line-height: 1.55;
}

.planner-prompt-actions {
  justify-content: flex-start;
  margin-top: 24px;
  gap: 14px;
}

.planner-prompt-actions .btn {
  min-width: 142px;
  padding-inline: 24px;
}

.planner-readiness-actions {
  margin-top: 18px;
}

.planner-readiness-head {
  justify-content: space-between;
  gap: 18px;
}

.planner-readiness-block {
  padding: 18px;
}

.planner-readiness-block h3 {
  margin-bottom: 8px;
  color: var(--brand-ink-soft);
  font-family: var(--font-body);
  font-size: 1.35rem;
  font-weight: 950;
  letter-spacing: 0;
}

.planner-weather-card {
  padding: 22px;
  background: rgba(255, 255, 255, 0.86);
}

.planner-weather-brief-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.planner-weather-brief-head h3 {
  margin-bottom: 6px;
  font-size: clamp(1.35rem, 2.2vw, 1.72rem);
}

.planner-weather-brief-head p {
  margin: 0;
  color: var(--brand-ink-muted);
  font-size: 0.88rem;
  font-weight: 800;
  line-height: 1.35;
}

.planner-weather-ai-badge {
  min-height: 30px;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
  background: #e8f3e9;
  color: #5f7a65;
  font-size: 0.72rem;
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
}

.planner-weather-ai-badge svg {
  width: 15px;
  height: 15px;
}

.planner-weather-trip-switch {
  margin-top: 18px;
  padding: 5px;
  border: 1px solid rgba(35, 45, 39, 0.08);
  border-radius: 14px;
  background: rgba(238, 243, 239, 0.9);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}

.planner-weather-trip-switch button {
  min-height: 58px;
  padding: 10px 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--brand-ink-muted);
  display: grid;
  align-content: center;
  gap: 3px;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.planner-weather-trip-switch button.active {
  background: #ffffff;
  color: var(--brand-ink-soft);
  box-shadow: 0 8px 22px rgba(35, 45, 39, 0.08);
}

.planner-weather-trip-switch span {
  font-size: 0.95rem;
  font-weight: 950;
  line-height: 1.1;
}

.planner-weather-trip-switch small {
  font-size: 0.76rem;
  font-weight: 850;
  line-height: 1.2;
}

.planner-weather-summary-card {
  margin-top: 22px;
  padding: 20px;
  border: 1px solid rgba(185, 216, 188, 0.66);
  border-radius: 12px;
  background: #e8f6e9;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
  color: var(--brand-ink-soft);
}

.planner-weather-summary-card.caution {
  border-color: rgba(239, 166, 43, 0.32);
  background: #fff5dc;
}

.planner-weather-summary-card.danger {
  border-color: rgba(194, 82, 68, 0.28);
  background: #fff0ed;
}

.planner-weather-summary-card.unavailable {
  border-color: rgba(103, 113, 110, 0.18);
  background: #f4f5f4;
}

.planner-weather-summary-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.58);
  color: #657a69;
}

.planner-weather-summary-card.caution .planner-weather-summary-icon {
  color: #8a651c;
}

.planner-weather-summary-card.danger .planner-weather-summary-icon {
  color: #9a3b30;
}

.planner-weather-summary-card.unavailable .planner-weather-summary-icon {
  color: #68716e;
}

.planner-weather-summary-icon svg {
  width: 21px;
  height: 21px;
}

.planner-weather-summary-card div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.planner-weather-summary-card strong,
.planner-weather-summary-card span,
.planner-weather-summary-card small {
  overflow-wrap: anywhere;
}

.planner-weather-summary-card strong {
  font-size: 1.02rem;
  font-weight: 950;
  line-height: 1.25;
}

.planner-weather-summary-card span {
  color: var(--brand-ink-muted);
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.35;
}

.planner-weather-summary-card small {
  color: #6f816f;
  font-size: 0.78rem;
  font-weight: 900;
  line-height: 1.25;
}

.planner-weather-loading {
  display: grid;
  gap: 20px;
}

.planner-weather-summary-skeleton {
  margin-top: 22px;
  padding: 20px;
  border: 1px solid rgba(185, 216, 188, 0.44);
  border-radius: 12px;
  background: rgba(244, 251, 245, 0.88);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16px;
}

.planner-weather-summary-skeleton span,
.planner-weather-summary-skeleton strong,
.planner-weather-summary-skeleton small,
.planner-weather-factor-skeleton span,
.planner-weather-factor-skeleton em,
.planner-weather-factor-skeleton strong,
.planner-weather-factor-skeleton small {
  overflow: hidden;
  border-radius: var(--r-pill);
  background: linear-gradient(90deg, #dfe4e6 0%, #eef1f2 42%, #dfe4e6 82%);
  background-size: 240% 100%;
  animation: planner-weather-shimmer 1.4s ease-in-out infinite;
}

.planner-weather-summary-skeleton > span {
  width: 42px;
  height: 42px;
  border-radius: 10px;
}

.planner-weather-summary-skeleton div {
  display: grid;
  align-content: center;
  gap: 10px;
}

.planner-weather-summary-skeleton strong {
  width: min(100%, 520px);
  height: 24px;
}

.planner-weather-summary-skeleton small {
  width: min(42%, 220px);
  height: 16px;
}

.planner-weather-factor-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

.planner-weather-factor-card {
  min-height: 112px;
  padding: 16px;
  border: 1px solid rgba(35, 45, 39, 0.06);
  border-radius: 12px;
  background: #fbfbf7;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: start;
  gap: 12px;
  box-shadow: 0 10px 26px rgba(35, 45, 39, 0.045);
}

.planner-weather-factor-card.rain {
  border-color: rgba(87, 132, 142, 0.2);
  background: #f3faf9;
}

.planner-weather-factor-card.humidity {
  border-color: rgba(97, 132, 113, 0.18);
  background: #f5faf2;
}

.planner-weather-factor-card.temperature {
  border-color: rgba(239, 166, 43, 0.2);
  background: #fffaf0;
}

.planner-weather-factor-card.wind {
  border-color: rgba(126, 145, 153, 0.2);
  background: #f6f8f8;
}

.planner-weather-factor-top {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(35, 45, 39, 0.04);
}

.planner-weather-factor-top svg {
  width: 21px;
  height: 21px;
  color: #6a7774;
}

.planner-weather-factor-card.rain .planner-weather-factor-top svg {
  color: #4f7982;
}

.planner-weather-factor-card.humidity .planner-weather-factor-top svg {
  color: #5f816b;
}

.planner-weather-factor-card.temperature .planner-weather-factor-top svg {
  color: #9a6a12;
}

.planner-weather-factor-card.wind .planner-weather-factor-top svg {
  color: #6c7f89;
}

.planner-weather-factor-top span {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.planner-weather-factor-card strong {
  color: var(--brand-ink-soft);
  display: grid;
  gap: 6px;
  font-size: 0.98rem;
  font-weight: 950;
  line-height: 1.28;
}

.planner-weather-factor-card .planner-weather-factor-label {
  color: #68756f;
  display: block;
  font-size: 0.74rem;
  font-weight: 950;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0;
}

.planner-weather-factor-skeleton {
  min-height: 138px;
  padding: 20px;
  border: 1px solid rgba(35, 45, 39, 0.04);
  border-radius: 10px;
  background: #f4f5f6;
  display: grid;
  grid-template-columns: 1fr auto;
  align-content: space-between;
  gap: 16px;
}

.planner-weather-factor-skeleton span {
  width: 34px;
  height: 34px;
  border-radius: 50%;
}

.planner-weather-factor-skeleton em {
  width: 42px;
  height: 12px;
  align-self: center;
}

.planner-weather-factor-skeleton strong {
  grid-column: 1 / -1;
  width: min(72%, 160px);
  height: 24px;
}

.planner-weather-factor-skeleton small {
  grid-column: 1 / -1;
  width: 100%;
  height: 3px;
}

@keyframes planner-weather-shimmer {
  0% { background-position: 120% 0; }
  100% { background-position: -120% 0; }
}

.planner-readiness-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.planner-readiness-title-row span {
  color: var(--brand-ink-muted);
  font-weight: 800;
}

.planner-readiness-advice,
.planner-readiness-result {
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(155, 224, 111, 0.2);
  color: var(--brand-ink-soft);
  font-weight: 800;
}

.planner-readiness-advice.unwell {
  background: rgba(239, 166, 43, 0.24);
}

.planner-comfort-notes {
  margin-top: 12px;
  padding: 0;
  list-style: none;
}

.planner-comfort-notes li {
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.64);
  color: var(--brand-ink-muted);
  font-weight: 700;
}

.planner-check-row {
  margin-top: 10px;
  align-items: flex-start;
  cursor: pointer;
}

.planner-check-row input {
  width: 22px;
  height: 22px;
  margin-top: 3px;
  accent-color: var(--brand-lime);
}

.planner-shopping-list {
  list-style: none;
  padding: 0;
}

.planner-shopping-list li {
  justify-content: space-between;
}

.planner-shopping-list button {
  color: #7b3426;
  font-weight: 900;
}

.route-planner-page.is-route-view {
  height: 100vh;
  min-height: 100vh;
  overflow: hidden;
  background: #d9ddd8;
}

.planner-route-shell {
  height: 100vh;
  display: grid;
  grid-template-columns: 430px 1fr;
  overflow: hidden;
}

.planner-route-panel {
  position: relative;
  z-index: 2;
  overflow: hidden;
  padding: 14px;
  background: var(--brand-paper-white);
  border-right: 1px solid var(--brand-line);
  display: flex;
  flex-direction: column;
  gap: 11px;
}

.rv-back-btn {
  width: fit-content;
  min-height: 54px;
  margin-bottom: 4px;
  padding: 0 30px;
  border-color: var(--brand-line);
  background: rgba(255, 255, 255, 0.9);
  color: var(--brand-ink-soft);
  font-size: 1.05rem;
}

.rv-back-btn:hover {
  background: #fff;
}

.planner-route-panel .rv-dest-header {
  align-items: flex-start;
  gap: 10px;
}

.planner-route-panel .rv-dest-icon-wrap {
  width: 42px;
  height: 42px;
  border-radius: 14px;
}

.planner-route-panel .rv-dest-icon-wrap img {
  width: 20px;
  height: 20px;
}

.planner-route-panel .rv-dest-type-label {
  font-size: 0.78rem;
}

.rv-dest-name {
  margin: 0;
  font-family: var(--font-body);
  color: var(--brand-ink-soft);
  font-size: 1.08rem;
  font-weight: 950;
  letter-spacing: 0;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.rv-dest-address {
  margin-top: 3px;
  color: var(--brand-ink-muted);
  font-size: 0.86rem;
  font-weight: 750;
  line-height: 1.32;
}

.rv-stats-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.rv-stat-card {
  padding: 10px 12px;
}

.rv-stat-main {
  display: flex;
  align-items: baseline;
  gap: 4px;
  flex-wrap: wrap;
}

.rv-stat-card strong {
  color: #1b5e20;
  font-size: 1.28rem;
  font-weight: 950;
  line-height: 1;
}

.rv-stat-card span,
.rv-fac-card span {
  color: var(--brand-ink-muted);
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.rv-section {
  display: grid;
  gap: 9px;
}

.rv-fac-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 8px;
}

.rv-route-fac-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.planner-route-panel .rv-fac-card img {
  width: 20px;
  height: 20px;
}

.planner-route-panel .rv-section h3 {
  font-size: 0.9rem;
}

.rv-fac-card {
  min-height: 78px;
  padding: 7px;
  display: grid;
  place-items: center;
  gap: 6px;
  text-align: center;
}

.rv-fac-card strong {
  display: block;
  color: var(--brand-ink-soft);
  font-size: 1.02rem;
  font-weight: 950;
  line-height: 1;
}

.rv-fac-bench {
  background: #eaf5e7;
  border-color: #c8e0c8;
}

.rv-fac-toilet {
  background: #e6f0f9;
  border-color: #c4d8ec;
}

.rv-fac-fountain {
  background: #e2f5f8;
  border-color: #b8dde8;
}

.rv-no-facilities {
  grid-column: 1 / -1;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(35, 45, 39, 0.06);
  color: var(--brand-ink-muted);
  font-weight: 800;
}

.rv-legend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--brand-ink-muted);
  min-height: 37px;
  font-size: 1.12rem;
  font-weight: 800;
}

.rv-legend-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex: 0 0 34px;
  display: grid;
  place-items: center;
}

.rv-licon-start { background: #a8d4e2; border: 2px solid #4e8292; }
.rv-licon-dest { background: #efa62b; border: 2px solid #9f6416; }
.rv-licon-bench { background: #7cb342; border: 2px solid #558b2f; }
.rv-licon-toilet { background: #2196f3; border: 2px solid #1565c0; }
.rv-licon-fountain { background: #00bcd4; border: 2px solid #0097a7; }

.rv-ldot {
  flex: 0 0 auto;
}

.rv-ldot-route {
  width: 34px;
  height: 5px;
  border-top: 4px dashed #2e7d32;
}

.rv-ldot-shade {
  width: 34px;
  height: 16px;
  border-radius: 5px;
  border: 1px solid rgba(76, 131, 67, 0.34);
  background: rgba(183, 228, 174, 0.62);
}

.planner-route-map-area {
  position: relative;
  min-width: 0;
  background: #d9ddd8;
}

.planner-route-map {
  width: 100%;
  height: 100%;
}

.planner-map-loading {
  position: absolute;
  inset: 0;
  z-index: 1001;
  display: grid;
  place-content: center;
  gap: 12px;
  background: rgba(244, 247, 242, 0.74);
  text-align: center;
}

.planner-map-shopping-card {
  position: absolute;
  z-index: 5;
  top: 18px;
  right: 18px;
  width: min(280px, calc(100% - 36px));
  border: 1px solid rgba(195, 216, 190, 0.94);
  border-radius: 16px;
  background: rgba(252, 255, 251, 0.94);
  box-shadow: 0 12px 32px rgba(19, 52, 30, 0.18);
  padding: 16px;
  color: #20372a;
}

.planner-map-shopping-card strong {
  display: block;
  margin-bottom: 8px;
  color: #163b22;
  font-weight: 950;
}

.planner-map-shopping-card ul {
  margin: 0;
  padding-left: 20px;
}

.planner-maplibre-marker {
  display: grid;
  justify-items: center;
  pointer-events: auto;
}

.planner-marker-highlighted {
  z-index: 80;
}

.rv-pin-start {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #a8d4e2;
  border: 3px solid #4e8292;
  box-shadow: 0 8px 22px rgba(78, 130, 146, 0.26);
  display: flex;
  align-items: center;
  justify-content: center;
}

.rv-pin-dest {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #efa62b;
  border: 3px solid #9f6416;
  box-shadow: 0 8px 24px rgba(159, 100, 22, 0.28);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1b150b;
  font-weight: 950;
}

.rv-pin-dest.is-highlighted {
  width: 58px;
  height: 58px;
  border-width: 4px;
  box-shadow: 0 12px 28px rgba(159, 100, 22, 0.34);
  transform: translateY(-5px);
}

.rv-pin-label {
  max-width: 100px;
  margin-top: 3px;
  color: var(--brand-ink-soft);
  font-size: 0.7rem;
  font-weight: 900;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow:
    0 1px 3px rgba(255, 255, 255, 0.9),
    0 0 6px rgba(255, 255, 255, 0.7);
}

.rv-pin-label-start {
  color: #315c69;
}

.rv-pin-fac {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 7px rgba(0, 0, 0, 0.22);
}

.rv-pin-fac-compact {
  width: 26px;
  height: 26px;
  opacity: 0.92;
}

.rv-pin-fac-compact img {
  width: 15px;
  height: 15px;
}

.rv-pin-bench { background: #7cb342; border: 2px solid #558b2f; }
.rv-pin-toilet { background: #2196f3; border: 2px solid #1565c0; }
.rv-pin-fountain { background: #00bcd4; border: 2px solid #0097a7; }

@media (max-width: 1040px) {
  .planner-step-nav {
    position: relative;
    top: auto;
    left: auto;
    right: auto;
    width: min(100% - var(--gutter) * 2, 980px);
    margin-left: auto;
    margin-right: auto;
    margin-top: calc(var(--nav-h) + 36px);
    transform: none;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .planner-step-nav button {
    min-height: 70px;
    grid-template-columns: 1fr;
    place-items: center;
    gap: 3px;
    padding: 10px 12px;
    text-align: center;
  }

  .planner-step-nav span {
    width: 28px;
    height: 28px;
  }

  .planner-step-nav small {
    font-size: 0.86rem;
    line-height: 1.1;
  }

  .planner-flow-shell {
    padding-top: clamp(34px, 5vw, 62px);
  }

  .planner-recommendation-layout,
  .planner-detail-layout {
    grid-template-columns: 1fr;
  }

  .planner-mini-map-panel {
    min-height: 440px;
  }

  .planner-mini-map {
    min-height: 360px;
  }

  .planner-route-shell {
    height: 100vh;
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .planner-route-panel {
    max-height: 42vh;
    border-right: 0;
    border-bottom: 1px solid var(--brand-line);
  }
}

@media (max-width: 760px) {
  .planner-step-nav {
    width: min(100% - 24px, 520px);
    grid-template-columns: repeat(4, 1fr);
    gap: 5px;
  }

  .planner-step-nav button {
    min-height: 56px;
    border-radius: 14px;
  }

  .planner-step-nav small {
    display: none;
  }

  .planner-shell {
    width: min(100% - 24px, 520px);
  }

  .planner-flow-hero {
    min-height: auto;
    padding-top: 38px;
  }

  .planner-card-heading,
  .planner-choice-row,
  .planner-detail-title-row {
    align-items: flex-start;
  }

  .planner-search-line,
  .planner-shopping-form,
  .planner-type-grid,
  .planner-segmented {
    grid-template-columns: 1fr;
  }

  .planner-type-card {
    min-height: 112px;
  }

  .planner-flow-action,
  .planner-summary-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .planner-result-toolbar {
    justify-content: stretch;
  }

  .planner-result-toolbar label,
  .planner-result-toolbar select {
    width: 100%;
  }

  .planner-destination-card {
    gap: 12px;
    padding: 16px;
  }

  .planner-destination-rank {
    width: 46px;
    height: 46px;
    flex-basis: 46px;
    font-size: 1.15rem;
  }

  .planner-destination-body {
    grid-template-columns: 1fr;
  }

  .planner-destination-topline,
  .planner-destination-main,
  .planner-card-score,
  .planner-destination-metrics,
  .planner-feature-chip-row,
  .planner-view-details {
    grid-column: 1;
  }

  .planner-card-score {
    grid-row: auto;
    justify-items: start;
  }

  .planner-score-badge-large {
    width: fit-content;
    min-height: 52px;
    flex-direction: row;
  }

  .route-planner-page .btn,
  .planner-back-btn,
  .planner-step-back-btn,
  .planner-map-picker-close,
  .planner-view-details {
    width: 100%;
  }

  .planner-readiness-backdrop {
    padding: 10px;
  }

  .planner-readiness-head {
    flex-direction: column;
  }

  .planner-route-panel {
    padding: 16px;
    max-height: 48vh;
  }
}
</style>

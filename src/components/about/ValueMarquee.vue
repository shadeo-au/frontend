<template>
  <div class="value-marquee" aria-hidden="true">
    <div class="value-marquee__track">
      <span v-for="item in 2" :key="item" class="value-marquee__set">
        <strong>Calm</strong>
        <i />
        <strong>Care</strong>
        <i />
        <strong>Local</strong>
        <i />
        <strong>Private</strong>
        <i />
        <strong>Practical</strong>
        <i />
      </span>
    </div>
  </div>
</template>

<style scoped>
.value-marquee {
  width: 100%;
  overflow: hidden;
  padding: clamp(22px, 4vw, 38px) 0;
  color: #2f6e69;
  background:
    linear-gradient(90deg, rgba(251, 250, 247, 0.98), transparent 14%, transparent 86%, rgba(251, 250, 247, 0.98)),
    #edf5ef;
  border-block: 1px solid rgba(35, 45, 39, 0.08);
}

.value-marquee:hover .value-marquee__track {
  animation-play-state: paused;
}

.value-marquee__track {
  display: flex;
  width: max-content;
  animation: value-marquee 30s linear infinite;
}

.value-marquee__set {
  display: inline-flex;
  align-items: center;
  gap: clamp(22px, 4vw, 52px);
  padding-inline-end: clamp(22px, 4vw, 52px);
}

.value-marquee strong {
  font-family: "Caveat", "Kalam", "Segoe Print", "Bradley Hand", cursive;
  font-size: clamp(3.1rem, 8vw, 8.5rem);
  font-weight: 800;
  line-height: 0.9;
  white-space: nowrap;
}

.value-marquee i {
  width: 10px;
  height: 10px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--brand-gold);
}

@keyframes value-marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .value-marquee__track {
    animation: none;
  }
}
</style>

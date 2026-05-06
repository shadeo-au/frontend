<template>
  <div class="value-marquee" aria-hidden="true">
    <div class="value-marquee__track">
      <span v-for="item in 2" :key="item" class="value-marquee__set">
        <strong>Calm</strong>
        <strong>Care</strong>
        <strong>Local</strong>
        <strong>Private</strong>
        <strong>Practical</strong>
      </span>
    </div>
  </div>
</template>

<style scoped>
.value-marquee {
  width: 100%;
  overflow: hidden;
  padding: clamp(18px, 3vw, 30px) 0;
  color: #2d6688;
  background:
    linear-gradient(90deg, rgba(237, 245, 239, 0.98), transparent 12%, transparent 88%, rgba(237, 245, 239, 0.98)),
    #edf5df;
  border-block: 1px solid rgba(35, 45, 39, 0.08);
}

.value-marquee__track {
  display: flex;
  width: max-content;
  animation: value-marquee 30s linear infinite;
}

.value-marquee__set {
  display: inline-flex;
  align-items: center;
  gap: clamp(90px, 18vw, 300px);
  padding-inline-end: clamp(90px, 18vw, 300px);
}

.value-marquee strong {
  font-family: "Caveat", "Kalam", "Segoe Print", "Bradley Hand", cursive;
  font-size: clamp(2.4rem, 5.8vw, 6.4rem);
  font-weight: 800;
  line-height: 0.9;
  white-space: nowrap;
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

const n = 10000;
let current = Array.from({ length: n }, (_, i) => ({ id: "id-" + i }));
const review = { id: 'id-5000' };

let current4 = Array.from({ length: n }, (_, i) => ({ id: "id-" + i }));
const start4 = performance.now();
for (let i = 0; i < 100; i++) {
  const idx = current4.findIndex((currentReview) => currentReview.id === review.id);
  if (idx !== -1) {
    const next = [...current4];
    next.splice(idx, 1);
    next.unshift({ ...review });
    current4 = next;
  } else {
    current4 = [{ ...review }, ...current4];
  }
}
console.log('findIndex + splice + unshift:', performance.now() - start4);

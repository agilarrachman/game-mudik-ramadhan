// js/food/sched.js — Penjadwal kerja berat: potong pekerjaan per frame supaya animasi & input tidak tersendat

/** Lepas thread utama sampai SETELAH frame berikutnya selesai digambar (sisa ~10ms frame bebas dipakai). */
export function nextSlice() {
    return new Promise((resolve) => {
        let done = false;
        const finish = () => { if (!done) { done = true; resolve(); } };
        if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => setTimeout(finish, 0));
        }
        setTimeout(finish, 120); // tab di latar belakang: rAF berhenti, tetap lanjut pelan-pelan
    });
}

/** Tunggu waktu senggang browser; bila `urgent()` true (pemain sudah menekan Main) tidak menunggu lama. */
export function idleSlice(urgent) {
    if (urgent && urgent()) return new Promise((r) => setTimeout(r, 0));
    return new Promise((resolve) => {
        if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 400 });
        else setTimeout(resolve, 60);
    });
}

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Jalankan generator sampai habis (jalur sinkron, dipakai bila tekstur diminta sebelum sempat dipanaskan). */
export function runSync(gen) {
    let r;
    do { r = gen.next(); } while (!r.done);
    return r.value;
}

/** Jalankan generator bertahap: tiap `budgetMs` ms kerja, lepas thread utama sampai frame berikutnya. */
export async function runSliced(gen, budgetMs = 9) {
    let t0 = performance.now();
    for (; ;) {
        const r = gen.next();
        if (r.done) return r.value;
        if (performance.now() - t0 > budgetMs) {
            await nextSlice();
            t0 = performance.now();
        }
    }
}

export function isGenerator(x) {
    return !!x && typeof x.next === 'function' && typeof x[Symbol.iterator] === 'function';
}
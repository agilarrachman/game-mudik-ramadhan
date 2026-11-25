"use strict";
/* ============ ITEM ART — illustration only, no text on pieces ============
   Style follows the reference sheet: rounded puffy shapes, soft shading,
   warm shadow, clear silhouette change at every level. */
function sh(){return '<ellipse cx="50" cy="88" rx="30" ry="5.5" fill="rgba(90,60,10,.16)"/>';}
var ART = {
bedug:[
 /* L1 wooden logs */
 '<svg viewBox="0 0 100 100">'+sh()+'<g stroke="#8a5a2b" stroke-width="2.5"><rect x="18" y="58" width="52" height="17" rx="8.5" fill="#b57e42"/><rect x="30" y="40" width="52" height="17" rx="8.5" fill="#c98d4e"/><rect x="24" y="22" width="46" height="16" rx="8" fill="#b57e42"/></g><circle cx="70" cy="66.5" r="6.5" fill="#e8c48d" stroke="#8a5a2b" stroke-width="2.5"/><circle cx="70" cy="66.5" r="2.6" fill="none" stroke="#b57e42" stroke-width="1.8"/><circle cx="82" cy="48.5" r="6.5" fill="#e8c48d" stroke="#8a5a2b" stroke-width="2.5"/><circle cx="82" cy="48.5" r="2.6" fill="none" stroke="#b57e42" stroke-width="1.8"/><circle cx="70" cy="30" r="6" fill="#e8c48d" stroke="#8a5a2b" stroke-width="2.5"/><circle cx="70" cy="30" r="2.4" fill="none" stroke="#b57e42" stroke-width="1.8"/><path d="M22 20 q-3-8 4-11 q2 6-1 10 q6-3 9 2 q-6 4-12-1z" fill="#4caf6d"/></svg>',
 /* L2 wooden frame */
 '<svg viewBox="0 0 100 100">'+sh()+'<g stroke="#8a5a2b" stroke-width="2" stroke-linecap="round"><path d="M30 84 L44 22 L52 22 L40 84 Z" fill="#c98d4e"/><path d="M70 84 L56 22 L48 22 L60 84 Z" fill="#b57e42"/><rect x="28" y="48" width="44" height="10" rx="5" fill="#a06a33"/></g><path d="M40 30 l9 9 M60 30 l-9 9" stroke="#f3e2b8" stroke-width="4" stroke-linecap="round"/><path d="M40 30 l9 9 M60 30 l-9 9" stroke="#d9b96a" stroke-width="1.6" stroke-linecap="round"/><rect x="24" y="14" width="52" height="9" rx="4.5" fill="#c98d4e" stroke="#8a5a2b" stroke-width="2"/></svg>',
 /* L3 bedug without drumstick */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M28 84 L38 58 M72 84 L62 58" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/><path d="M22 84 h56" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M18 34 q32-12 64 0 l-4 26 q-28 9-56 0 z" fill="#b57e42"/><ellipse cx="26" cy="42" rx="9" ry="17" fill="#f3dfba" stroke="#8a5a2b" stroke-width="2.5" transform="rotate(6 26 42)"/><path d="M74 30 q4 14 1 28" stroke="#8a5a2b" stroke-width="3" fill="none"/><circle cx="33" cy="30" r="2.2" fill="#7c4a1e"/><circle cx="50" cy="26" r="2.2" fill="#7c4a1e"/><circle cx="67" cy="30" r="2.2" fill="#7c4a1e"/></svg>',
 /* L4 complete bedug with drumstick + ornament */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M26 86 L37 58 M74 86 L63 58" stroke="#8a5a2b" stroke-width="7" stroke-linecap="round"/><path d="M20 86 h60" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M16 32 q34-13 68 0 l-4 28 q-30 10-60 0 z" fill="#0e9f6e"/><path d="M16 32 q34-13 68 0 l-1 9 q-33-11-66 0z M20 53 q30 9 60 0 l0 7 q-30 10-60 0z" fill="#0b7a55"/><ellipse cx="24" cy="40" rx="9" ry="18" fill="#f7e7c3" stroke="#8a5a2b" stroke-width="2.5" transform="rotate(6 24 40)"/><path d="M50 24 l3.5 6 6.5 1-4.7 4.6 1.1 6.5L50 39l-6.4 3.1 1.1-6.5L40 31l6.5-1z" fill="#f5b921"/><g stroke="#d99a06" stroke-width="2.4" stroke-linecap="round"><path d="M76 52 l10 22"/><circle cx="88" cy="78" r="2" fill="#d99a06"/></g><circle cx="74" cy="48" r="6.5" fill="#f5b921" stroke="#d99a06" stroke-width="2"/><path d="M36 62 l3 4 4-4 4 4 4-4 4 4 4-4" stroke="#f5b921" stroke-width="2.2" fill="none"/></svg>'
],
ketupat:[
 /* L1 palm leaves */
 '<svg viewBox="0 0 100 100">'+sh()+'<g stroke-linecap="round"><path d="M50 86 C44 60 34 38 18 24" stroke="#3e9e4f" stroke-width="9" fill="none"/><path d="M50 86 C48 56 44 32 36 14" stroke="#57b968" stroke-width="9" fill="none"/><path d="M50 86 C52 54 58 30 68 14" stroke="#3e9e4f" stroke-width="9" fill="none"/><path d="M50 86 C58 62 70 44 84 34" stroke="#6fca7f" stroke-width="9" fill="none"/><path d="M50 86 C50 62 50 40 50 20" stroke="#7ed491" stroke-width="8" fill="none"/></g></svg>',
 /* L2 woven palm leaves (flat weave mat) */
 '<svg viewBox="0 0 100 100">'+sh()+'<g transform="rotate(-8 50 50)"><rect x="22" y="30" width="56" height="42" rx="7" fill="#57b968"/><path d="M22 44 h56 M22 58 h56" stroke="#3e9e4f" stroke-width="7"/><path d="M36 30 v42 M50 30 v42 M64 30 v42" stroke="#7ed491" stroke-width="7" opacity=".85"/><rect x="22" y="30" width="56" height="42" rx="7" fill="none" stroke="#2f7d3c" stroke-width="2.5"/></g></svg>',
 /* L3 unfinished ketupat — loose diamond, open top */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M38 12 q4 10-2 16 M62 12 q-4 10 2 16" stroke="#57b968" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M50 24 L76 48 L50 76 L24 48 Z" fill="#6fca7f" stroke="#2f7d3c" stroke-width="2.5"/><path d="M33 40 L67 62 M67 40 L33 62 M50 28 V72 M28 48 H72" stroke="#3e9e4f" stroke-width="4" opacity=".7"/><path d="M40 76 l-3 12 M60 76 l3 12" stroke="#57b968" stroke-width="6" stroke-linecap="round"/></svg>',
 /* L4 complete ketupat — tight weave + bow */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M50 22 C42 8 28 8 30 18 c1 7 12 8 20 4z M50 22 C58 8 72 8 70 18 c-1 7-12 8-20 4z" fill="#57b968" stroke="#2f7d3c" stroke-width="2.2"/><circle cx="50" cy="23" r="4.5" fill="#3e9e4f"/><path d="M50 26 L78 50 L50 80 L22 50 Z" fill="#7ed491" stroke="#2f7d3c" stroke-width="2.5"/><path d="M34 38 L66 64 M66 38 L34 64 M50 30 V76 M26 50 H74" stroke="#3e9e4f" stroke-width="4.5" opacity=".8"/><path d="M41 80 l-2 10 M59 80 l2 10" stroke="#57b968" stroke-width="6" stroke-linecap="round"/><path d="M38 32 l4 3 M62 32 l-4 3" stroke="#eaffea" stroke-width="3" stroke-linecap="round" opacity=".8"/></svg>'
],
vehicle:[
 /* L1 vehicle parts */
 '<svg viewBox="0 0 100 100">'+sh()+'<circle cx="28" cy="62" r="16" fill="#374151"/><circle cx="28" cy="62" r="16" fill="none" stroke="#111827" stroke-width="3"/><circle cx="28" cy="62" r="6.5" fill="#d1d5db"/><path d="M52 22 h20 q5 0 5 5 v16 h-25z" fill="#e05252"/><rect x="57" y="27" width="13" height="11" rx="2" fill="#bae6fd"/><rect x="58" y="48" width="24" height="17" rx="5" fill="#6b7c93"/><rect x="62" y="42" width="16" height="8" rx="3" fill="#54677f"/><g stroke="#9ca3af" stroke-width="5" stroke-linecap="round"><path d="M52 74 l12 10"/><circle cx="50" cy="72" r="4.5" fill="none" stroke="#9ca3af" stroke-width="4"/></g></svg>',
 /* L2 basic vehicle frame / chassis */
 '<svg viewBox="0 0 100 100">'+sh()+'<rect x="14" y="52" width="72" height="9" rx="4" fill="#54677f"/><rect x="30" y="42" width="34" height="11" rx="4" fill="#6b7c93"/><rect x="58" y="28" width="17" height="16" rx="4" fill="#8a5a3b"/><rect x="60" y="30" width="13" height="7" rx="2" fill="#5b3d24"/><circle cx="28" cy="68" r="11" fill="#374151" stroke="#111827" stroke-width="2.5"/><circle cx="28" cy="68" r="4.5" fill="#d1d5db"/><circle cx="72" cy="68" r="11" fill="#374151" stroke="#111827" stroke-width="2.5"/><circle cx="72" cy="68" r="4.5" fill="#d1d5db"/><path d="M18 52 v-8 M82 52 v-8" stroke="#54677f" stroke-width="5" stroke-linecap="round"/></svg>',
 /* L3 almost complete vehicle — plain van */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M14 66 V42 q0-10 10-12 l8-8 q3-3 8-3 h22 q6 0 9 5 l7 10 q8 3 8 12 v20z" fill="#f3ead3"/><path d="M14 56 h72 v10 H14z" fill="#3aa68c"/><rect x="36" y="24" width="13" height="12" rx="2.5" fill="#bae6fd"/><rect x="53" y="24" width="13" height="12" rx="2.5" fill="#bae6fd"/><rect x="19" y="36" width="12" height="11" rx="2.5" fill="#bae6fd"/><circle cx="20" cy="60" r="3" fill="#fde68a"/><circle cx="30" cy="70" r="9" fill="#374151" stroke="#111827" stroke-width="2.5"/><circle cx="30" cy="70" r="3.8" fill="#d1d5db"/><circle cx="70" cy="70" r="9" fill="#374151" stroke="#111827" stroke-width="2.5"/><circle cx="70" cy="70" r="3.8" fill="#d1d5db"/></svg>',
 /* L4 complete mudik vehicle — decorated van + roof luggage */
 '<svg viewBox="0 0 100 100">'+sh()+'<rect x="30" y="8" width="26" height="12" rx="4" fill="#b57e42" stroke="#8a5a2b" stroke-width="2"/><rect x="54" y="10" width="20" height="10" rx="4" fill="#0e9f6e" stroke="#0b7a55" stroke-width="2"/><path d="M28 21 h48" stroke="#8a5a2b" stroke-width="3.5" stroke-linecap="round"/><path d="M12 70 V44 q0-10 10-12 l8-8 q3-3 8-3 h24 q6 0 9 5 l7 10 q8 3 8 12 v22z" fill="#f7efdb"/><path d="M12 58 h74 v12 H12z" fill="#0e9f6e"/><rect x="36" y="27" width="13" height="12" rx="2.5" fill="#bae6fd"/><rect x="53" y="27" width="13" height="12" rx="2.5" fill="#bae6fd"/><rect x="18" y="39" width="12" height="11" rx="2.5" fill="#bae6fd"/><path d="M60 60 a6 6 0 1 0 4 10 a4.6 4.6 0 1 1-4-10z" fill="#f5b921"/><path d="M24 61 l4 4 4-4 4 4 4-4" stroke="#f5b921" stroke-width="2.4" fill="none"/><circle cx="18" cy="63" r="3" fill="#fde68a"/><circle cx="29" cy="73" r="9" fill="#374151" stroke="#111827" stroke-width="2.5"/><circle cx="29" cy="73" r="3.8" fill="#d1d5db"/><circle cx="70" cy="73" r="9" fill="#374151" stroke="#111827" stroke-width="2.5"/><circle cx="70" cy="73" r="3.8" fill="#d1d5db"/></svg>'
],
outfit:[
 /* L1 fabric — folded cloth */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M20 34 q30-10 60 0 v14 q-30-10-60 0z" fill="#0e9f6e"/><path d="M20 48 q30-10 60 0 v26 q-30 10-60 0z" fill="#12b981"/><path d="M20 60 q30-10 60 0" stroke="#f5b921" stroke-width="3" fill="none"/><path d="M34 40 l3 5 3-5 3 5 3-5 M56 66 l3 5 3-5 3 5 3-5" stroke="#fde68a" stroke-width="2.2" fill="none"/><path d="M50 24 l2 4 4 .6-3 3 .7 4-3.7-2-3.7 2 .7-4-3-3 4-.6z" fill="#f5b921"/></svg>',
 /* L2 cut fabric + scissors + thread */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M14 30 l34-8 6 26-34 8z" fill="#12b981"/><path d="M40 52 l36-6 4 24-36 6z" fill="#0e9f6e"/><path d="M24 34 l3 4 3-4 M52 58 l3 4 3-4" stroke="#fde68a" stroke-width="2.2" fill="none"/><g stroke="#9ca3af" stroke-width="3.4" stroke-linecap="round"><path d="M62 22 L78 44 M78 22 L62 44"/></g><circle cx="60" cy="50" r="4.5" fill="none" stroke="#e05252" stroke-width="3"/><circle cx="80" cy="50" r="4.5" fill="none" stroke="#e05252" stroke-width="3"/><rect x="82" y="58" width="11" height="16" rx="3" fill="#f5b921"/><path d="M84 62 h7 M84 67 h7" stroke="#d99a06" stroke-width="2"/></svg>',
 /* L3 partially sewn outfit — half-finished shirt */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M38 18 h24 l16 12-8 12-6-4 v44 q0 6-6 6 H42 q-6 0-6-6 V38 l-6 4-8-12z" fill="#f3ead3"/><path d="M50 18 h12 l16 12-8 12-6-4 v44 q0 6-6 6 h-8z" fill="#12b981"/><path d="M50 20 v62" stroke="#d99a06" stroke-width="3" stroke-dasharray="5 4"/><path d="M42 18 q8 8 16 0 q-2 9-8 9 t-8-9z" fill="#e8dcc0"/><circle cx="50" cy="38" r="2.4" fill="#d99a06"/><path d="M64 74 h-8" stroke="#f5b921" stroke-width="3" stroke-linecap="round"/></svg>',
 /* L4 complete Eid outfit — koko set with gold trim + pants */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M37 12 h26 l17 13-8 13-7-5 v33 q0 5-5 5 H40 q-5 0-5-5 V33 l-7 5-8-13z" fill="#0e9f6e"/><path d="M50 14 v52" stroke="#f5b921" stroke-width="3.5"/><path d="M41 12 q9 9 18 0 q-2 10-9 10 t-9-10z" fill="#0b7a55"/><path d="M35 60 h30" stroke="#f5b921" stroke-width="3"/><path d="M27 36 l6 3 M73 36 l-6 3" stroke="#f5b921" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="32" r="2.3" fill="#fde68a"/><circle cx="50" cy="42" r="2.3" fill="#fde68a"/><circle cx="50" cy="52" r="2.3" fill="#fde68a"/><path d="M38 73 h10 v14 q0 4-5 4 t-5-4z M52 73 h10 v14 q0 4-5 4 t-5-4z" fill="#0b7a55"/><path d="M38 82 h10 M52 82 h10" stroke="#f5b921" stroke-width="2.6"/></svg>'
],
cookies:[
 /* L1 baking ingredients — flour bag, eggs, butter */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M22 30 q14-8 28 0 l4 44 q0 8-8 8 H26 q-8 0-8-8z" fill="#f7efdb" stroke="#d9c9a3" stroke-width="2.5"/><path d="M22 30 q14 7 28 0" fill="#efe3c2"/><path d="M36 44 c-5 8-5 13 0 18 c5-5 5-10 0-18z M31 56 q5-4 10 0" stroke="#d99a06" stroke-width="2.2" fill="#fde68a"/><ellipse cx="66" cy="66" rx="10" ry="12" fill="#f3d9b8" transform="rotate(18 66 66)"/><ellipse cx="78" cy="74" rx="9" ry="11" fill="#eecfa5" transform="rotate(24 78 74)"/><rect x="58" y="34" width="24" height="15" rx="3.5" fill="#ffd94d" stroke="#eab308" stroke-width="2" transform="rotate(-6 70 41)"/></svg>',
 /* L2 cookie dough + rolling pin */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M18 78 q32 9 64 0 l-4 7 q-28 7-56 0z" fill="#fff" opacity=".65"/><ellipse cx="50" cy="56" rx="27" ry="21" fill="#f7d774"/><path d="M30 48 q8-9 20-10" stroke="#ffeeb0" stroke-width="5" fill="none" stroke-linecap="round"/><g transform="rotate(-24 58 74)"><rect x="30" y="69" width="52" height="11" rx="5.5" fill="#c98d4e"/><rect x="20" y="71.5" width="12" height="6" rx="3" fill="#8a5a2b"/><rect x="80" y="71.5" width="12" height="6" rx="3" fill="#8a5a2b"/></g></svg>',
 /* L3 unfinished cookies — tray of pale dough balls */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M14 34 h72 l-7 46 q-1 6-7 6 H28 q-6 0-7-6z" fill="#54677f"/><path d="M14 34 h72 l-2 12 H16z" fill="#6b7c93"/><circle cx="34" cy="56" r="9" fill="#f7d774"/><circle cx="52" cy="52" r="9" fill="#f9e08a"/><circle cx="68" cy="57" r="9" fill="#f7d774"/><circle cx="43" cy="70" r="9" fill="#f9e08a"/><circle cx="61" cy="71" r="9" fill="#f7d774"/></svg>',
 /* L4 complete cookie jar — nastar jar with bow */
 '<svg viewBox="0 0 100 100">'+sh()+'<path d="M30 38 h40 q8 0 8 9 v30 q0 11-11 11 H33 q-11 0-11-11 V47 q0-9 8-9z" fill="rgba(220,240,255,.55)" stroke="#b9d6e8" stroke-width="2.5"/><circle cx="38" cy="58" r="8" fill="#f2a81d"/><circle cx="54" cy="52" r="8" fill="#f7bc3a"/><circle cx="66" cy="62" r="8" fill="#f2a81d"/><circle cx="44" cy="72" r="8" fill="#f7bc3a"/><circle cx="60" cy="78" r="8" fill="#f2a81d"/><circle cx="38" cy="58" r="2.6" fill="#d97706"/><circle cx="54" cy="52" r="2.6" fill="#d97706"/><circle cx="66" cy="62" r="2.6" fill="#d97706"/><rect x="24" y="26" width="52" height="13" rx="6.5" fill="#0e9f6e"/><path d="M50 26 c-9-9-20-6-18 1 c1 6 11 5 18-1z M50 26 c9-9 20-6 18 1 c-1 6-11 5-18-1z" fill="#12b981"/><circle cx="50" cy="26" r="4" fill="#0b7a55"/><circle cx="50" cy="19" r="4.5" fill="#f5b921" stroke="#d99a06" stroke-width="1.8"/></svg>'
]
};
var COIN_SVG = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#f5b921" stroke="#d99a06" stroke-width="3"/><path d="M20 10 l2.4 4.9 5.4.8-3.9 3.8.9 5.4L20 22.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8z" fill="#ffe98a"/></svg>';
var SUITCASE_SVG = '<svg id="suitcaseArt" viewBox="0 0 160 120"><path d="M58 16 q4-12 22-12 t22 12" fill="none" stroke="#8a5a2b" stroke-width="9" stroke-linecap="round"/><rect x="14" y="18" width="132" height="92" rx="18" fill="#43a854"/><rect x="14" y="18" width="132" height="92" rx="18" fill="none" stroke="#2f7a3c" stroke-width="3"/><path d="M14 44 h132 M14 86 h132" stroke="#2f7a3c" stroke-width="3" opacity=".55"/><path d="M30 18 v92 M130 18 v92" stroke="#f5b921" stroke-width="9" opacity=".9"/><rect x="24" y="52" width="12" height="18" rx="4" fill="#f5b921" stroke="#d99a06" stroke-width="2"/><rect x="124" y="52" width="12" height="18" rx="4" fill="#f5b921" stroke="#d99a06" stroke-width="2"/><path d="M14 36 q0-18 18-18 l6 14-14 8z M146 36 q0-18-18-18 l-6 14 14 8z M14 92 q0 18 18 18 l6-14-14-8z M146 92 q0 18-18 18 l-6-14 14-8z" fill="#f7c65c"/><path d="M96 34 a13 13 0 1 0 6 22 a10.5 10.5 0 1 1-6-22z" fill="#f5b921"/><path d="M52 92 q4-14 12-16 q2-8 8-8 t6 8 q8 2 12 16z" fill="#f7c65c"/><path d="M108 66 l1.8 3.7 4 .6-2.9 2.9.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.9 4-.6z" fill="#fde68a"/><g transform="translate(6,38) scale(.52)"><path d="M50 26 L78 50 L50 80 L22 50 Z" fill="#7ed491" stroke="#2f7d3c" stroke-width="4"/><path d="M34 38 L66 64 M66 38 L34 64" stroke="#3e9e4f" stroke-width="5"/></g></svg>';
var GAMEOVER_SVG = '<svg viewBox="0 0 200 130"><ellipse cx="100" cy="118" rx="62" ry="7" fill="rgba(90,60,10,.15)"/><g><rect x="52" y="34" width="96" height="76" rx="14" fill="#43a854" stroke="#2f7a3c" stroke-width="3"/><path d="M76 34 q4-14 24-14 t24 14" fill="none" stroke="#8a5a2b" stroke-width="8" stroke-linecap="round"/><path d="M122 52 a11 11 0 1 0 5 19 a9 9 0 1 1-5-19z" fill="#f5b921"/><g transform="translate(58,52) scale(.5)"><path d="M50 26 L78 50 L50 80 L22 50 Z" fill="#7ed491" stroke="#2f7d3c" stroke-width="4"/><path d="M34 38 L66 64 M66 38 L34 64" stroke="#3e9e4f" stroke-width="5"/></g><circle cx="128" cy="88" r="9" fill="#f5b921" stroke="#d99a06" stroke-width="2.5"/><path d="M128 82 l1.7 3.5 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5z" fill="#ffe98a"/></g><path d="M28 22 l2 5 5 2-5 2-2 5-2-5-5-2 5-2z M172 14 l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#f5b921"/></svg>';

var CHAINS = [
  {id:'bedug',   name:'Bedug'},
  {id:'ketupat', name:'Ketupat'},
  {id:'vehicle', name:'Mobil Mudik'},
  {id:'outfit',  name:'Baju Lebaran'},
  {id:'cookies', name:'Kue Lebaran'}
];
var COIN_PER_TAP = 10, MAX_TAPS = 5, NCELL = 12;
var MERGE_SCORE = [0, 10, 25, 50]; /* score for creating lvl 1..3 (index = new lvl) */

/* ============ STATE ============ */
var uid = 1;
var state;
function freshState(){
  return { coins:0, score:0, merges:0, finalsMade:0, board:new Array(NCELL).fill(null), over:false };
}
state = freshState();

/* ============ SOUND (WebAudio, no files) ============ */
var soundOn = true, actx = null;
function beep(freq, dur, type, vol, when){
  if(!soundOn) return;
  try{
    if(!actx) actx = new (window.AudioContext||window.webkitAudioContext)();
    if(actx.state==='suspended') actx.resume();
    var t = actx.currentTime + (when||0);
    var o = actx.createOscillator(), g = actx.createGain();
    o.type = type||'sine'; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol||.12, t); g.gain.exponentialRampToValueAtTime(.001, t+dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t+dur);
  }catch(e){}
}
var sfx = {
  pop:  function(){ beep(520,.09,'sine',.12); beep(780,.08,'sine',.08,.04); },
  merge:function(){ beep(523,.1,'triangle',.14); beep(659,.1,'triangle',.14,.07); beep(880,.16,'triangle',.14,.14); },
  coin: function(){ beep(1180,.07,'square',.06); beep(1560,.12,'square',.06,.06); },
  final:function(){ [523,659,784,1046].forEach(function(f,i){ beep(f,.14,'triangle',.12,i*.08); }); },
  over: function(){ [440,349,293,220].forEach(function(f,i){ beep(f,.2,'sine',.12,i*.16); }); }
};

/* ============ DOM ============ */
var boardEl = document.getElementById('board');
var ghost = document.getElementById('dragGhost');
document.getElementById('suitcaseBtn').innerHTML = SUITCASE_SVG;
document.getElementById('goArt').innerHTML = GAMEOVER_SVG;
var toastTimer = null;
function toast(msg){
  var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 2400);
}
(function(){ var sky=document.getElementById('sky'); for(var i=0;i<20;i++){ var s=document.createElement('span'); s.className='star'; s.textContent='✦'; s.style.left=(Math.random()*97)+'%'; s.style.top=(Math.random()*44)+'%'; s.style.animationDelay=(Math.random()*2.5)+'s'; s.style.fontSize=(9+Math.random()*10)+'px'; sky.appendChild(s);} })();

/* guide */
(function(){
  var body = document.getElementById('guideBody');
  CHAINS.forEach(function(ch){
    var row = document.createElement('div'); row.className='chain-row';
    var html = '<span class="cr-name">'+ch.name+'</span>';
    for(var l=0;l<4;l++){ html += '<span class="cr-item">'+ART[ch.id][l]+'</span>' + (l<3?'<span class="arr">▶</span>':''); }
    row.innerHTML = html; body.appendChild(row);
  });
})();

/* ============ RENDER ============ */
function renderBoard(popUid, mergeUid){
  boardEl.innerHTML = '';
  var filled = 0;
  for(var i=0;i<NCELL;i++){
    (function(idx){
      var it = state.board[idx]; if(it) filled++;
      var cell = document.createElement('div');
      cell.className = 'cell' + (it?' filled':'') + (it && it.lvl===3 ? ' final':'');
      cell.dataset.idx = idx;
      if(it){
        var art = document.createElement('span'); art.className='item-art'; art.innerHTML = ART[it.chain][it.lvl];
        cell.appendChild(art);
        if(it.lvl===3){
          var dots = document.createElement('span'); dots.className='tap-dots';
          for(var d=0;d<MAX_TAPS;d++){ var dot=document.createElement('i'); if(d < MAX_TAPS - it.taps) dot.className='on'; dots.appendChild(dot); }
          cell.appendChild(dots);
        }
        if(popUid && it.uid===popUid) cell.classList.add('pop');
        if(mergeUid && it.uid===mergeUid) cell.classList.add('merge-fx');
      }
      boardEl.appendChild(cell);
    })(i);
  }
  document.getElementById('filledVal').textContent = filled;
}
function renderHUD(){
  document.getElementById('coinVal').textContent = state.coins.toLocaleString('id-ID');
  document.getElementById('scoreVal').textContent = state.score.toLocaleString('id-ID');
}
function renderAll(popUid, mergeUid){ renderBoard(popUid, mergeUid); renderHUD(); }

function sparksAt(cellIdx, chars){
  var cell = boardEl.children[cellIdx]; if(!cell) return;
  var br = boardEl.getBoundingClientRect(), cr = cell.getBoundingClientRect();
  var cx = cr.left-br.left+cr.width/2, cy = cr.top-br.top+cr.height/2;
  (chars||['✨','⭐','💛','🌙']).forEach(function(ch,i){
    var s=document.createElement('span'); s.className='spark'; s.textContent=ch;
    s.style.left=cx+'px'; s.style.top=cy+'px';
    var ang=(i/4)*Math.PI*2+Math.random()*.6;
    s.style.setProperty('--dx', Math.cos(ang)*(36+Math.random()*22)+'px');
    s.style.setProperty('--dy', Math.sin(ang)*(36+Math.random()*22)+'px');
    boardEl.appendChild(s); setTimeout(function(){ s.remove(); }, 750);
  });
}

/* ============ GAME LOGIC ============ */
function emptyCells(){ var r=[]; for(var i=0;i<NCELL;i++) if(!state.board[i]) r.push(i); return r; }
function hasPossibleMerge(){
  var seen = {};
  for(var i=0;i<NCELL;i++){
    var it = state.board[i]; if(!it) continue;
    if(it.lvl===3) return true; /* a finished item can always be tapped away */
    var k = it.chain+':'+it.lvl;
    if(seen[k]) return true;
    seen[k] = true;
  }
  return false;
}
function checkGameOver(){
  if(state.over) return;
  if(emptyCells().length===0 && !hasPossibleMerge()){
    state.over = true;
    sfx.over();
    document.getElementById('goScore').textContent = state.score.toLocaleString('id-ID');
    document.getElementById('goCoins').textContent = state.coins.toLocaleString('id-ID');
    setTimeout(function(){ document.getElementById('ovOver').classList.add('show'); }, 450);
  }
}
function openSuitcase(){
  if(state.over) return;
  var emp = emptyCells();
  if(!emp.length){ toast('😮 Papan penuh! Gabungkan item atau panen item emas dulu ya.'); return; }
  var btn = document.getElementById('suitcaseBtn');
  btn.classList.remove('opening'); void btn.offsetWidth; btn.classList.add('opening');
  var ch = CHAINS[Math.floor(Math.random()*CHAINS.length)];
  var it = { uid: uid++, chain: ch.id, lvl: 0, taps: 0 };
  var idx = emp[Math.floor(Math.random()*emp.length)];
  state.board[idx] = it;
  sfx.pop();
  renderAll(it.uid);
  sparksAt(idx, ['✨','🎉','⭐']);
  document.getElementById('suitDesc').textContent = 'Ada bahan baru di papan! Cari gambar yang sama, lalu seret untuk menggabungkannya.';
  checkGameOver();
}
function doMerge(srcIdx, dstIdx){
  var a = state.board[srcIdx];
  var next = { uid: uid++, chain: a.chain, lvl: a.lvl+1, taps: 0 };
  state.board[srcIdx] = null; state.board[dstIdx] = next;
  state.merges++;
  state.score += MERGE_SCORE[next.lvl];
  if(next.lvl===3){ state.finalsMade++; state.score += 40; }
  renderAll(null, next.uid);
  sparksAt(dstIdx, next.lvl===3 ? ['🎉','✨','⭐','🌙','💛'] : ['✨','⭐','💛']);
  if(next.lvl===3){ sfx.final(); toast('🎉 Item lengkap! Ketuk 5× untuk memanen koin 🪙'); }
  else sfx.merge();
  checkGameOver();
}
function tapFinal(idx){
  var it = state.board[idx]; if(!it || it.lvl!==3) return;
  it.taps++;
  state.coins += COIN_PER_TAP;
  state.score += 5;
  sfx.coin();
  /* coin burst flying up toward the HUD */
  var cell = boardEl.children[idx];
  if(cell){
    cell.classList.remove('wobble'); void cell.offsetWidth; cell.classList.add('wobble');
    var br = boardEl.getBoundingClientRect(), cr = cell.getBoundingClientRect();
    for(var c=0;c<3;c++){
      var f = document.createElement('span'); f.className='float-coin'; f.innerHTML = COIN_SVG;
      var sz = 24+Math.random()*8;
      f.style.width = sz+'px'; f.style.height = sz+'px';
      f.style.left = (cr.left-br.left+cr.width/2-sz/2+(Math.random()*36-18))+'px';
      f.style.top = (cr.top-br.top+6)+'px';
      f.style.setProperty('--mx', (Math.random()*44-22)+'px');
      f.style.setProperty('--fx', (Math.random()*30-15)+'px');
      f.style.setProperty('--fy', (-(cr.top-br.top)-70)+'px');
      f.style.animationDelay = (c*0.07)+'s';
      boardEl.appendChild(f); setTimeout(function(el){ return function(){ el.remove(); }; }(f), 1150);
    }
    var plus = document.createElement('span'); plus.className='plus-label'; plus.textContent = '+'+COIN_PER_TAP+' 🪙';
    plus.style.left = (cr.left-br.left+cr.width/2-20)+'px'; plus.style.top = (cr.top-br.top-8)+'px';
    boardEl.appendChild(plus); setTimeout(function(){ plus.remove(); }, 900);
    sparksAt(idx, ['✦','💛','✦']);
  }
  if(it.taps >= MAX_TAPS){
    var cellEl = boardEl.children[idx];
    if(cellEl) cellEl.classList.add('vanish');
    setTimeout(function(){
      if(state.board[idx]===it) state.board[idx] = null;
      renderAll(); checkGameOver();
    }, 360);
    renderHUD();
    toast('✨ Item selesai dipanen! Slot kosong lagi.');
  } else {
    renderAll(); renderHUD();
    /* re-apply wobble after re-render */
    var nc = boardEl.children[idx]; if(nc){ nc.classList.add('wobble'); }
  }
}

/* ============ DRAG & TAP ============ */
var drag = null;
function sameItem(a,b){ return a && b && a.chain===b.chain && a.lvl===b.lvl; }
function cellFromPoint(x,y){
  var els = document.elementsFromPoint(x,y);
  for(var i=0;i<els.length;i++){ if(els[i].classList && els[i].classList.contains('cell')) return parseInt(els[i].dataset.idx,10); }
  return -1;
}
boardEl.addEventListener('pointerdown', function(ev){
  if(state.over) return;
  var cellEl = ev.target.closest('.cell'); if(!cellEl) return;
  var idx = parseInt(cellEl.dataset.idx,10);
  if(!state.board[idx]) return;
  drag = { idx: idx, startX: ev.clientX, startY: ev.clientY, moved:false };
  try{ boardEl.setPointerCapture(ev.pointerId); }catch(e){}
});
boardEl.addEventListener('pointermove', function(ev){
  if(!drag) return;
  var dx = ev.clientX-drag.startX, dy = ev.clientY-drag.startY;
  if(!drag.moved && Math.hypot(dx,dy) > 9){
    drag.moved = true;
    var it = state.board[drag.idx];
    ghost.innerHTML = ART[it.chain][it.lvl];
    ghost.style.display = 'block';
  }
  if(drag.moved){
    ghost.style.left = ev.clientX+'px'; ghost.style.top = ev.clientY+'px';
    var t = cellFromPoint(ev.clientX, ev.clientY);
    Array.prototype.forEach.call(boardEl.children, function(c,i){
      c.classList.remove('drop-ok','drop-bad');
      if(t===i && i!==drag.idx){
        var a = state.board[drag.idx], b = state.board[i];
        var ok = !b || (sameItem(a,b) && a.lvl < 3);
        c.classList.add(ok?'drop-ok':'drop-bad');
      }
    });
  }
});
boardEl.addEventListener('pointerup', function(ev){
  if(!drag) return;
  var d = drag; drag = null;
  ghost.style.display = 'none';
  Array.prototype.forEach.call(boardEl.children, function(c){ c.classList.remove('drop-ok','drop-bad'); });
  var srcIt = state.board[d.idx]; if(!srcIt) return;
  if(!d.moved){
    if(srcIt.lvl===3) tapFinal(d.idx);
    return;
  }
  var dst = cellFromPoint(ev.clientX, ev.clientY);
  if(dst<0 || dst===d.idx){ renderAll(); return; }
  var dstIt = state.board[dst];
  if(!dstIt){ state.board[dst] = srcIt; state.board[d.idx] = null; renderAll(srcIt.uid); return; }
  if(sameItem(srcIt, dstIt) && srcIt.lvl < 3){ doMerge(d.idx, dst); return; }
  /* swap */
  state.board[dst] = srcIt; state.board[d.idx] = dstIt; renderAll();
});
boardEl.addEventListener('pointercancel', function(){ drag=null; ghost.style.display='none'; renderAll(); });

/* ============ BUTTONS / OVERLAYS ============ */
document.getElementById('openBtn').addEventListener('click', openSuitcase);
document.getElementById('suitcaseBtn').addEventListener('click', openSuitcase);
document.getElementById('btnSound').addEventListener('click', function(){
  soundOn = !soundOn;
  this.textContent = soundOn ? '🔊' : '🔇';
  if(soundOn) sfx.pop();
  toast(soundOn ? '🔊 Suara menyala' : '🔇 Suara mati');
});
function openOv(id){ document.getElementById(id).classList.add('show'); }
function closeOv(id){ document.getElementById(id).classList.remove('show'); }
document.getElementById('btnRestart').addEventListener('click', function(){ openOv('ovRestart'); });
document.getElementById('btnGuide').addEventListener('click', function(){ openOv('ovGuide'); });
function restart(){
  state = freshState(); uid = 1;
  seedBoard();
  closeOv('ovRestart'); closeOv('ovOver');
  document.getElementById('suitDesc').textContent = 'Ketuk kopernya — satu bahan acak melompat ke papan!';
  renderAll();
  toast('🌙 Permainan baru dimulai! Selamat menggabungkan!');
}
document.getElementById('btnRestartYes').addEventListener('click', restart);
document.getElementById('btnPlayAgain').addEventListener('click', restart);
Array.prototype.forEach.call(document.querySelectorAll('[data-close]'), function(b){
  b.addEventListener('click', function(){ closeOv(b.dataset.close); });
});
Array.prototype.forEach.call(document.querySelectorAll('.overlay'), function(ov){
  ov.addEventListener('click', function(ev){ if(ev.target===ov && ov.id!=='ovOver') ov.classList.remove('show'); });
});

/* ============ INIT — two starter pairs so the first merge is one drag away ============ */
function seedBoard(){
  var starters = [
    { chain:'ketupat', spot:0 }, { chain:'ketupat', spot:1 },
    { chain:'bedug', spot:3 },   { chain:'bedug', spot:4 }
  ];
  starters.forEach(function(s){ state.board[s.spot] = { uid: uid++, chain: s.chain, lvl: 0, taps: 0 }; });
}
seedBoard();
renderAll();
openOv('ovGuide');

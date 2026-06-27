/* ════════════════════════════════════════════════════════
   개발용 화면 설정: 테마, 글꼴, 카드 모양, 언어, 국가, 움직임
   ════════════════════════════════════════════════════════ */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "terracotta",
  "type": "sans",
  "cardstyle": "polaroid",
  "lang": "kr",
  "country": "United States",
  "motion": 100
}/*EDITMODE-END*/;

let tweaks = { ...TWEAK_DEFAULTS };

function applyTweaks() {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.type = tweaks.type;
    document.body.dataset.cardstyle = tweaks.cardstyle;
    document.body.dataset.lang = tweaks.lang;
    document.documentElement.style.setProperty('--motion-scale', tweaks.motion / 100 || 0.01);

    document.querySelectorAll('.swatch').forEach(s => s.classList.toggle('on', s.dataset.theme === tweaks.theme));
    document.querySelectorAll('.seg').forEach(seg => {
        const key = seg.dataset.tweak;
        seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.val === tweaks[key]));
    });
    const cs = document.getElementById('homeCountrySelect');
    const tc = document.getElementById('tweakCountry');
    const sc = document.getElementById('settingsCountrySelect');
    if (cs) cs.value = tweaks.country;
    if (tc) tc.value = tweaks.country;
    if (sc) sc.value = tweaks.country;
    homeCountry = tweaks.country;
    updateFlagAndBadges();
    const ms = document.getElementById('motionSlider');
    if (ms) { ms.value = tweaks.motion; document.getElementById('motionVal').innerText = tweaks.motion + '%'; }
}

function setTweak(key, val) {
    tweaks[key] = val;
    applyTweaks();
    if (window.parent !== window) {
        window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: val } }, '*');
    }
}

/* 외부 편집 화면과 설정값을 주고받는 메시지 처리 */
window.addEventListener('message', (e) => {
    if (!e.data || typeof e.data !== 'object') return;
    if (e.data.type === '__activate_edit_mode') document.getElementById('tweaksPanel').classList.add('active');
    if (e.data.type === '__deactivate_edit_mode') document.getElementById('tweaksPanel').classList.remove('active');
});
function closeTweaks() {
    document.getElementById('tweaksPanel').classList.remove('active');
    if (window.parent !== window) window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
}

/* 개발용 설정 패널의 버튼과 입력 항목에 동작을 연결합니다. */
function wireTweaks() {
    document.querySelectorAll('.swatch').forEach(s => {
        s.onclick = () => setTweak('theme', s.dataset.theme);
    });
    document.querySelectorAll('.seg').forEach(seg => {
        const key = seg.dataset.tweak;
        seg.querySelectorAll('button').forEach(b => {
            b.onclick = () => setTweak(key, b.dataset.val);
        });
    });
    document.getElementById('tweakCountry').onchange = (e) => setTweak('country', e.target.value);
    document.getElementById('motionSlider').oninput = (e) => setTweak('motion', parseInt(e.target.value, 10));
}

/* ════════════════════════════════════════════════════════
   화면에서 사용하는 샘플 데이터와 앱 상태
   ════════════════════════════════════════════════════════ */
// 국가 선택에 따라 국기, 줄임말, Lens 제목을 표시할 때 사용합니다.
const COUNTRY_META = {
    "United States": { flag: "🇺🇸", short: "USA", lensLabel: "USA · Lens" },
    "China":         { flag: "🇨🇳", short: "CN",  lensLabel: "China · Lens" },
    "Taiwan":        { flag: "🇹🇼", short: "TW",  lensLabel: "Taiwan · Lens" },
    "Japan":         { flag: "🇯🇵", short: "JP",  lensLabel: "Japan · Lens" }
};

// 현재 데모에서 보여주는 국가별 문화 비교 문구입니다. API 연동 후에는 응답값으로 대체됩니다.
const COMPARISONS = {
    "온돌": {
        "United States": "Like a radiant floor heating system in a quiet New England farmhouse — but Korea has been doing this for centuries. Where Western homes warm the air (radiators, vents), 'Ondol' warms the very floor you sit on, turning the ground into hearth. It's why Koreans naturally sit on the floor: it's the warmest place in the house.",
        "China": "Similar to the traditional kang bed-stove of northern China, but Ondol sends heat beneath a wider room floor so the whole living space becomes warm.",
        "Taiwan": "Taiwan has less need for traditional floor heating because of its warmer climate. Imagine modern heated flooring turned into the center of everyday sitting, eating, and sleeping.",
        "Japan": "다다미 위 코타츠와 비슷한 따스함을 떠올려보세요. 하지만 코타츠가 작은 테이블 한 켠을 데운다면, 한국의 온돌은 방 전체의 바닥을 데워 '집 전체가 하나의 따뜻한 그릇'이 되도록 합니다. 좌식 문화의 깊이가 여기에 있습니다."
    },
    "쌈": {
        "United States": "Think of it as a Korean taco — but where the taco wraps savory fillings in a tortilla, 'Ssam' wraps grilled meat, garlic, and fermented paste in a fresh perilla or lettuce leaf. It's hand food, conversation food, generosity food. The host wraps a bite and feeds it to a guest.",
        "China": "Like wrapping Peking duck and vegetables at the table, but Ssam uses fresh lettuce or perilla leaves with grilled meat, garlic, and fermented ssamjang.",
        "Taiwan": "Similar to building a small lettuce wrap at the table: one bite combines meat, fresh herbs, garlic, and a strong fermented sauce.",
        "Japan": "스시 위에 올리는 정성을 손바닥 위에서 펼친다고 상상해보세요. 일본의 한 입 음식은 정갈한 조립이라면, 한국의 쌈은 즉흥적인 합주입니다. 상추·깻잎이라는 무대 위에 고기·마늘·쌈장이 한꺼번에 폭발하는, 정확히 한 입 안의 작은 향연이죠."
    },
    "한복": {
        "United States": "Less 'fitted couture,' more 'flowing silhouette.' Where Western formalwear (suit, gown) sculpts the body's outline, 'Hanbok' celebrates the curve and drape of fabric over a softly indicated form. It is dignity in motion — the air between cloth and skin is part of the design.",
        "China": "Hanbok and Hanfu are both historical forms of dress, but Hanbok is recognized by its short jeogori jacket, high waist, and rounded, spacious silhouette.",
        "Taiwan": "Like traditional clothing worn for festivals and ceremonies, Hanbok expresses heritage through color and flowing fabric, with a distinctly Korean high-waisted silhouette.",
        "Japan": "기모노가 직선과 절제로 몸을 감싼다면, 한복은 곡선과 여백으로 몸을 풀어줍니다. 저고리는 작고 단정하게 묶고, 치마는 한껏 부풀려 바람을 품도록 한 것이 한복의 호흡입니다. 같은 동아시아의 정중함, 다른 결의 미감입니다."
    },
    "국밥": {
        "United States": "Picture a deeply savory pork or beef broth poured over a bowl of rice — like a New York deli's chicken-rice soup, but slow-simmered for hours and finished at the table with chili paste, salt, and chopped scallions. It's the original Korean fast-comfort food: arrives hot, eats fast, warms the whole body.",
        "China": "Close to paofan, rice served in hot broth, but Gukbap usually has a deeper meat stock and is seasoned at the table with scallions, chili, or salted shrimp.",
        "Taiwan": "It has the comforting role of a hot Taiwanese soup meal, but the rice is placed directly into a long-simmered meat broth and served as one complete bowl.",
        "Japan": "라면과 비슷한 위치이지만 면 대신 밥을 말아 먹는 따뜻한 한 그릇. 장시간 우려낸 육수에 파·소금·다대기 양념을 더해 각자가 맛을 완성하는 — 일본의 '도쿄마시자면'과 잘 어울리는 속도감·공동체 음식입니다."
    },
    "막걸리": {
        "United States": "An unfiltered rice wine — cloudy, lightly fizzy, lower in alcohol than wine. Think craft farmhouse cider in spirit: rustic, communal, poured into wide bowls and shared. It's the drink Koreans reach for with savory pancakes on a rainy afternoon.",
        "China": "Related to Chinese rice wines through fermentation, but Makgeolli is cloudier, lightly sparkling, and usually lower in alcohol than huangjiu.",
        "Taiwan": "Its sweet rice aroma may recall fermented rice dishes such as jiuniang, but Makgeolli is a lightly fizzy alcoholic drink made for sharing with food.",
        "Japan": "사케와 같은 쌀로 빚지만 거르지 않아 뿌옇고 가볍게 탄산이 살아 있는 발효주. 도자기 잔에 따라 낙지안주·전과 나누어 마시는, 개인 한 잔보다 '함께의 자리'를 위해 만들어진 술."
    },
    "닭갈비": {
        "United States": "Think of a spicy skillet barbecue shared at the table: chicken, cabbage, rice cakes, and sauce cooked together until smoky and sweet-hot.",
        "China": "Similar to a shared dry pot meal, with chicken and vegetables cooked together at the table, but Dakgalbi uses a sweet-spicy gochujang sauce.",
        "Taiwan": "It shares the communal feeling of a sizzling Taiwanese chicken dish, but adds cabbage, rice cakes, and a bold gochujang sauce on a wide griddle.",
        "Japan": "鉄板で鶏肉と野菜を甘辛く炒める、みんなで囲む韓国式の鶏料理。"
    }
};

// 현재 화면 확인용 샘플 데이터입니다. API 연동 시 Gemini/RAG 응답으로 교체합니다.
const mockCultureData = [
    { kr: "닭갈비 (Dakgalbi)", krBase: "닭갈비", eng: "Spicy Korean stir-fried chicken cooked on a shared griddle", img: "assets/dakgalbi.png", date: "2026.05.27" },
    { kr: "쌈 (Ssam)",   krBase: "쌈",   eng: "Korean wrap food culture using lettuce or perilla leaves", img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=600", date: "2026.05.27" },
    { kr: "한복 (Hanbok)", krBase: "한복", eng: "Traditional Korean aesthetic dress", img: "https://images.unsplash.com/photo-1596701062351-dfc799a7e6c5?auto=format&fit=crop&q=80&w=600", date: "2026.05.27" }
];

let activeSampleIdx = 0;
// 사용자가 폴더에 저장하기 전까지 가장 최근의 스캔 결과를 보관합니다.
let scannedData = null;
let homeCountry = "United States";

// Culture Book 폴더와 그 안에 저장된 카드의 샘플 데이터입니다.
let cultureFolders = {
    seoul: {
        title: "Chuncheon Food Trip",
        type: "route",
        season: "2026 spring",
        cards: [
            {
                kr: "국밥 (Gukbap)",
                krBase: "국밥",
                eng: "Korean rice-in-soup, a slow-simmered everyday comfort meal",
                desc: COMPARISONS["국밥"]["United States"],
                tags: ["#K-food", "#soup", "#pork"],
                shortDef: "A hot bowl of rice served inside rich Korean soup.",
                cultureMatch: {
                    "United States": "Similar to chicken rice soup or diner comfort food, but deeper and served boiling hot.",
                    "China": "Close to paofan, but with a deeper meat broth and stronger table seasonings.",
                    "Taiwan": "Like a comforting hot soup meal, with rice served directly inside the rich broth.",
                    "Japan": "Similar to ramen as a quick hot meal, but rice replaces noodles."
                },
                img: "assets/gukbap.jpg",
                date: "2026.05.25",
                targetCountry: "United States",
                place: "강원 춘천시 공지로242번길 25 1층 오시드래요",
                mapQuery: "강원 춘천시 공지로242번길 25 1층 오시드래요"
            },
            {
                kr: "막걸리 (Makgeolli)",
                krBase: "막걸리",
                eng: "Unfiltered Korean rice wine, milky and lightly sparkling",
                desc: COMPARISONS["막걸리"]["United States"],
                tags: ["#rice wine", "#shared drink", "#fermented"],
                shortDef: "A cloudy, lightly sparkling Korean rice alcohol shared with food.",
                cultureMatch: {
                    "United States": "Closer to natural wine or craft cider than whiskey: casual, cloudy, and shared.",
                    "China": "Related to rice wine, but cloudier, lighter, and gently sparkling.",
                    "Taiwan": "Its fermented rice aroma recalls jiuniang, but it is a lightly fizzy shared drink.",
                    "Japan": "Related to sake through rice, but unfiltered and more casual at the table."
                },
                img: "assets/makgeolli.jpg",
                date: "2026.05.26",
                targetCountry: "United States",
                place: "문배마을 신가네",
                mapQuery: "문배마을 신가네 강원 춘천시 남산면 강촌문배길 485-5"
            }
        ]
    },
    busan: {
        title: "Gangneung Food Walk",
        type: "food",
        season: "2026 spring",
        cards: []
    }
};

// 현재 선택한 폴더, 카드, 사용자, 화면 상태를 관리하는 변수입니다.
let currentActiveFolderId = "seoul";
let currentDetailCardIdx = 0;
let pendingFolderTriggerMode = "list";
let isFlipped = false;
let selectedCommunityCard = null;
let communityUploadSelectMode = false;
let activeStoryMapQuery = "Seoul Korea";
let mapReturnScreen = "communityScreen";
let currentUser = null;

// 카카오맵에 표시할 장소 좌표와 검색용 주소 및 키워드입니다.
const KAKAO_PLACES = {
    korea: { lat: 36.2, lng: 127.9, title: "대한민국" },
    seoul: { lat: 37.5665, lng: 126.9780, title: "서울" },
    chuncheon: { lat: 37.8813, lng: 127.7298, title: "춘천" },
    gangneung: { lat: 37.8057, lng: 128.9086, title: "강릉 경포해변" },
    sokcho: { lat: 38.2018, lng: 128.5918, title: "강원 속초시 청호로 115-12 아바이회국수" },
    busan: { lat: 35.1796, lng: 129.0756, title: "부산" },
    gamja: {
        lat: 37.9284,
        lng: 127.7808,
        title: "카페감자밭 본점",
        poiKeyword: "카페감자밭 본점",
        address: "강원특별자치도 춘천시 신북읍 신샘밭로 674",
        locationSource: "curated",
        lockCoordinate: true
    },
    gukbap: {
        lat: 37.86525,
        lng: 127.73633,
        title: "춘천시 오시드래요",
        poiKeyword: "오시드래요",
        address: "강원 춘천시 공지로242번길 25 1층",
        locationSource: "curated",
        lockCoordinate: true
    },
    makgeolli: {
        lat: 37.7961288,
        lng: 127.6163503,
        title: "문배마을 신가네",
        poiKeyword: "문배마을 신가네",
        address: "강원 춘천시 남산면 강촌문배길 485-5",
        locationSource: "curated",
        lockCoordinate: true
    }
};
const KAKAO_PLACE_ADDRESSES = {
    gamja: ["강원특별자치도 춘천시 신북읍 신샘밭로 674", "춘천시 신북읍 신샘밭로 674"],
    gukbap: ["강원 춘천시 공지로242번길 25", "춘천시 공지로242번길 25"],
    makgeolli: ["강원 춘천시 남산면 강촌문배길 485-5", "춘천시 남산면 강촌문배길 485-5"]
};
const KAKAO_PLACE_EXACT_KEYWORDS = {
    gamja: ["카페감자밭 본점", "춘천 카페감자밭 본점"],
    gukbap: ["오시드래요", "춘천 오시드래요", "춘천시 오시드래요"],
    makgeolli: ["문배마을 신가네", "춘천 문배마을 신가네"]
};
const KAKAO_PLACE_KEYWORDS = {
    gamja: ["카페감자밭 본점", "춘천 감자밭", "강원특별자치도 춘천시 신북읍 신샘밭로 674", "신샘밭로 674"],
    gukbap: ["강원 춘천시 공지로242번길 25 1층 오시드래요", "오시드래요 공지로242번길", "오시드래요"],
    makgeolli: ["문배마을 신가네", "춘천 문배마을 신가네", "문배마을", "강원 춘천시 남산면 강촌문배길 485-5", "강촌문배길 485-5"]
};
const HOME_MAP_PHOTOS = [
    {
        id: "gukbap",
        placeKey: "gukbap",
        place: KAKAO_PLACES.gukbap,
        query: "강원 춘천시 공지로242번길 25 1층 오시드래요",
        title: "국밥 · 춘천시 오시드래요",
        img: "assets/gukbap.jpg",
        count: "1"
    },
    {
        id: "makgeolli",
        placeKey: "makgeolli",
        place: KAKAO_PLACES.makgeolli,
        query: "문배마을 신가네 강원 춘천시 남산면 강촌문배길 485-5",
        title: "막걸리 · 문배마을 신가네",
        img: "assets/makgeolli.jpg",
        count: "1"
    }
];
// 카카오맵 객체와 지도 위 마커 및 사진 오버레이의 현재 상태입니다.
let kakaoReady = false;
let homeMap = null;
let detailMap = null;
let bookMap = null;
let detailMarker = null;
let bookMarker = null;
let homePhotoOverlays = [];
let homeClusterOverlay = null;
let kakaoPlacesService = null;
let kakaoGeocoder = null;

/* ════════════════════════════════════════════════════════
   앱 시작 시 필요한 화면과 기능 초기화
   ════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
    wireTweaks();
    applyTweaks();
    setupCarousel();
    setCameraTargetGuide();
    renderFolderList();
    updateStats();
    loadAuth();
    updateAuthUI();
    initKakaoMaps();

    // 시작 화면을 잠시 보여준 뒤 로그인 또는 홈 화면으로 이동합니다.
    setTimeout(() => {
        const splash = document.getElementById('splashScreen');
        splash.style.transform = 'translateY(-100%)';
        splash.style.opacity = '0';
        changeScreen(currentUser ? 'mainScreen' : 'loginScreen');
        setTimeout(() => { splash.classList.remove('active'); splash.style.display = 'none'; }, 700);
    }, 1900);

    // 외부 편집 화면에 개발용 설정 패널을 사용할 수 있다고 알립니다.
    if (window.parent !== window) {
        window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    }

    // 외부 미리보기 화면과 현재 화면 번호를 맞추기 위한 메시지입니다.
    window.parent.postMessage({ slideIndexChanged: 0 }, '*');
});

/* ════════════════════════════════════════════════════════
   화면 이동 처리
   ════════════════════════════════════════════════════════ */
function changeScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    if (id === 'cameraScreen') {
        scannedData = null;
        document.getElementById('saveBtn').classList.remove('visible');
        document.getElementById('dummySaveSpace').style.display = 'block';
        document.getElementById('preScanState').style.display = 'flex';
        document.getElementById('postScanState').classList.remove('active');
        document.getElementById('scanLaser').style.display = 'block';
        const badge = document.getElementById('scanStatusBadge');
        badge.className = 'cam-status-pill live';
        badge.textContent = 'SCANNING LIVE';
    } else if (id === 'bookScreen') {
        renderFolderList();
        updateStats();
    }

    if (id === 'mainScreen') {
        setTimeout(() => {
            renderHomeKakaoMap();
            if (homeMap && window.kakao) {
                homeMap.relayout();
                resetHomeMapView();
                updateHomePhotoPins();
            }
        }, 140);
    }
    if (id === 'bookDetailScreen') {
        setTimeout(() => updateBookMapBackground(), 80);
    }
}

/* Lens Talk 화면 열기와 검색 상태를 관리합니다. */
function openCommunity() {
    if (!currentUser) {
        changeScreen('loginScreen');
        return;
    }
    changeScreen('communityScreen');
}

function openLogin() {
    changeScreen('loginScreen');
}

/* 로그인 정보는 현재 브라우저의 localStorage에 임시로 저장합니다. */
function makeHandle(value) {
    const base = String(value || 'traveler')
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '')
        .slice(0, 9) || 'traveler';
    return `@${base}`;
}

function saveAuth(user) {
    currentUser = user;
    localStorage.setItem('cultureLensUser', JSON.stringify(user));
    updateAuthUI();
}

function loadAuth() {
    try {
        currentUser = JSON.parse(localStorage.getItem('cultureLensUser')) || null;
    } catch {
        currentUser = null;
    }
}

function updateAuthUI() {
    const label = document.getElementById('accountLabel');
    const community = document.getElementById('communityAccount');
    const handle = currentUser ? currentUser.handle : '@guest';
    const compactHandle = handle.length > 10 ? `${handle.slice(0, 9)}…` : handle;
    if (label) label.innerText = currentUser ? compactHandle : 'SIGN IN';
    if (community) community.innerText = 'Lens Talk';
}

/* 카카오맵 초기화, 장소 검색, 지도와 사진 마커 표시를 담당합니다. */
function resolvePlace(query = "") {
    const q = String(query).toLowerCase();
    if (q.includes("감자") || q.includes("신샘밭") || q.includes("신북읍") || q.includes("gamja")) return KAKAO_PLACES.gamja;
    if (q.includes("강릉") || q.includes("경포") || q.includes("창해로") || q.includes("gangneung")) return KAKAO_PLACES.gangneung;
    if (q.includes("속초") || q.includes("청호로") || q.includes("아바이")) return KAKAO_PLACES.sokcho || KAKAO_PLACES.gangneung;
    if (q.includes("오시드래요") || q.includes("공지로242") || q.includes("gukbap") || q.includes("osideuraeyo")) return KAKAO_PLACES.gukbap;
    if (q.includes("문배마을") || q.includes("강촌문배길") || q.includes("485-5") || q.includes("makgeolli") || q.includes("singane")) return KAKAO_PLACES.makgeolli;
    return KAKAO_PLACES.chuncheon;
}

function initKakaoMaps() {
    const fallback = document.getElementById('homeMapFallback');
    if (!window.kakao || !kakao.maps) {
        setTimeout(() => {
            if (window.kakao && kakao.maps) initKakaoMaps();
            else if (fallback) {
                fallback.textContent = "Kakao map is not loading. Check the JavaScript key and Web domain.";
                fallback.classList.add('show');
            }
        }, 700);
        return;
    }
    kakao.maps.load(() => {
        kakaoReady = true;
        kakaoPlacesService = new kakao.maps.services.Places();
        kakaoGeocoder = new kakao.maps.services.Geocoder();
        if (fallback) fallback.classList.remove('show');
        loadKakaoPlaceCoordinates();
        if (document.getElementById('mainScreen')?.classList.contains('active')) {
            renderHomeKakaoMap();
        }
        if (document.getElementById('bookDetailScreen')?.classList.contains('active')) {
            updateBookMapBackground();
        }
    });
}

function makeLatLng(place) {
    return new kakao.maps.LatLng(place.lat, place.lng);
}

function placeText(item) {
    return `${item.place_name || ''} ${item.address_name || ''} ${item.road_address_name || ''}`.replace(/\s+/g, '');
}

function placeMatchScore(key, item) {
    const text = placeText(item);
    if (key === 'gamja') {
        let score = 0;
        if (text.includes('카페감자밭')) score += 130;
        if (text.includes('신샘밭로674')) score += 100;
        if (text.includes('감자밭')) score += 100;
        if (text.includes('신북읍')) score += 30;
        if (text.includes('춘천')) score += 10;
        return score;
    }
    if (key === 'gangneung') {
        let score = 0;
        if (text.includes('경포')) score += 100;
        if (text.includes('강릉')) score += 50;
        return score;
    }
    if (key === 'gukbap') {
        let score = 0;
        if (text.includes('오시드래요')) score += 100;
        if (text.includes('공지로242번길25')) score += 100;
        if (text.includes('춘천')) score += 10;
        return score;
    }
    if (key === 'makgeolli') {
        let score = 0;
        if (text.includes('신가네')) score += 100;
        if (text.includes('문배마을')) score += 100;
        if (text.includes('문배')) score += 70;
        if (text.includes('강촌문배길485-5')) score += 120;
        if (text.includes('춘천') || text.includes('남산면') || text.includes('강촌')) score += 10;
        return score;
    }
    return text.includes('춘천') || text.includes('강원') ? 1 : 0;
}

function findBestKakaoPlace(key, results) {
    return [...results]
        .map(item => ({ item, score: placeMatchScore(key, item) }))
        .filter(entry => entry.score >= 100)
        .sort((a, b) => b.score - a.score)[0]?.item || null;
}

function isMatchingPlace(key, item) {
    return placeMatchScore(key, item) >= 100;
}

function isCoordinateLocked(key) {
    const place = KAKAO_PLACES[key];
    return Boolean(place?.lockCoordinate || place?.fixed || place?.locationSource === "curated");
}

function applyKakaoPlaceCoordinate(key, lat, lng, title) {
    if (isCoordinateLocked(key)) {
        updateHomeOverlayPositions();
        return;
    }
    KAKAO_PLACES[key].lat = Number(lat);
    KAKAO_PLACES[key].lng = Number(lng);
    if (title) KAKAO_PLACES[key].title = title;
    updateHomeOverlayPositions();
}

function searchKakaoAddress(addresses, onFound, onMiss) {
    if (!kakaoGeocoder || !addresses.length) {
        onMiss();
        return;
    }
    const searchNext = (idx = 0) => {
        if (idx >= addresses.length) {
            onMiss();
            return;
        }
        kakaoGeocoder.addressSearch(addresses[idx], (results, status) => {
            if (status !== kakao.maps.services.Status.OK || !results.length) {
                searchNext(idx + 1);
                return;
            }
            onFound(results[0], addresses[idx]);
        });
    };
    searchNext();
}

function searchKakaoKeyword(key, keywords, onFound, onMiss = () => {}) {
    if (!kakaoPlacesService || !keywords.length) {
        onMiss();
        return;
    }
    const keywordList = Array.isArray(keywords) ? keywords : [keywords];
    const searchNext = (idx = 0) => {
        if (idx >= keywordList.length) {
            onMiss();
            return;
        }
        kakaoPlacesService.keywordSearch(keywordList[idx], (results, status) => {
            if (status !== kakao.maps.services.Status.OK || !results.length) {
                searchNext(idx + 1);
                return;
            }
            const place = findBestKakaoPlace(key, results);
            if (!place) {
                searchNext(idx + 1);
                return;
            }
            onFound(place);
        });
    };
    searchNext();
}

function loadKakaoPlaceCoordinates() {
    if (!kakaoPlacesService && !kakaoGeocoder) return;
    Object.entries(KAKAO_PLACE_KEYWORDS).forEach(([key, keywords]) => {
        if (isCoordinateLocked(key)) {
            updateHomeOverlayPositions();
            return;
        }
        const addresses = KAKAO_PLACE_ADDRESSES[key] || [];
        const exactKeywords = KAKAO_PLACE_EXACT_KEYWORDS[key] || [];
        searchKakaoKeyword(key, exactKeywords, exactPlace => {
            applyKakaoPlaceCoordinate(key, exactPlace.y, exactPlace.x, exactPlace.place_name || KAKAO_PLACES[key].title);
        }, () => {
            searchKakaoAddress(addresses, result => {
                applyKakaoPlaceCoordinate(key, result.y, result.x, KAKAO_PLACES[key].title);
            }, () => {
                searchKakaoKeyword(key, keywords, place => {
                    applyKakaoPlaceCoordinate(key, place.y, place.x, place.place_name || KAKAO_PLACES[key].title);
                });
            });
        });
    });
}

function updateHomeOverlayPositions() {
    HOME_MAP_PHOTOS.forEach(photo => {
        photo.place = KAKAO_PLACES[photo.placeKey || photo.id] || photo.place;
    });
    homePhotoOverlays.forEach((overlay, idx) => {
        const photo = HOME_MAP_PHOTOS[idx];
        if (photo) overlay.setPosition(makeLatLng(photo.place));
    });
    if (homeClusterOverlay) {
        homeClusterOverlay.setPosition(makeLatLng(KAKAO_PLACES.chuncheon));
    }
    if (homeMap) updateHomePhotoPins();
}

function resetHomeMapView() {
    if (!homeMap) return;
    homeMap.setCenter(makeLatLng(KAKAO_PLACES.korea));
    homeMap.setLevel(13);
}

function renderHomeKakaoMap() {
    const fallback = document.getElementById('homeMapFallback');
    if (!kakaoReady) {
        if (fallback) {
            fallback.textContent = "Loading Kakao map...";
            fallback.classList.add('show');
        }
        return;
    }
    if (homeMap) return;
    const el = document.getElementById('homeKakaoMap');
    if (!el) return;
    homeMap = new kakao.maps.Map(el, {
        center: makeLatLng(KAKAO_PLACES.korea),
        level: 13
    });
    if (fallback) fallback.classList.remove('show');
    renderHomePhotoOverlays();
    kakao.maps.event.addListener(homeMap, 'zoom_changed', updateHomePhotoPins);
    setTimeout(() => {
        homeMap.relayout();
        resetHomeMapView();
        updateHomePhotoPins();
    }, 120);
}

function createHomePhotoButton(photo) {
    const button = document.createElement('button');
    button.className = `map-photo-pin ${photo.id}`;
    button.type = 'button';
    button.setAttribute('aria-label', photo.title);
    button.innerHTML = `<img src="${photo.img}" alt=""><span class="count">${photo.count}</span>`;
    button.addEventListener('click', () => openMapView(photo.query, photo.title, 'mainScreen'));
    return button;
}

function createHomeClusterButton() {
    const button = document.createElement('button');
    button.className = 'map-photo-pin cluster';
    button.type = 'button';
    button.setAttribute('aria-label', 'Chuncheon culture photos');
    button.innerHTML = `
        ${HOME_MAP_PHOTOS.map(photo => `<img class="stack-img" src="${photo.img}" alt="">`).join('')}
    `;
    button.addEventListener('click', () => {
        if (!homeMap) return;
        resetHomeMapView();
        setTimeout(updateHomePhotoPins, 260);
    });
    return button;
}

function renderHomePhotoOverlays() {
    if (!homeMap || homePhotoOverlays.length) return;
    homePhotoOverlays = HOME_MAP_PHOTOS.map(photo => new kakao.maps.CustomOverlay({
        position: makeLatLng(photo.place),
        content: createHomePhotoButton(photo),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 4
    }));
    homeClusterOverlay = new kakao.maps.CustomOverlay({
        position: makeLatLng(KAKAO_PLACES.chuncheon),
        content: createHomeClusterButton(),
        xAnchor: 0.5,
        yAnchor: 0.5,
        zIndex: 5
    });
    updateHomePhotoPins();
}

function updateHomePhotoPins() {
    if (!homeMap) return;
    if (homeClusterOverlay) homeClusterOverlay.setMap(null);
    homePhotoOverlays.forEach(overlay => overlay.setMap(homeMap));
}

function renderDetailKakaoMap(query) {
    if (!kakaoReady) return;
    const el = document.getElementById('detailKakaoMap');
    if (!el) return;
    const place = resolvePlace(query);
    const position = makeLatLng(place);
    if (!detailMap) {
        detailMap = new kakao.maps.Map(el, { center: position, level: 4 });
    } else {
        detailMap.setCenter(position);
    }
    if (detailMarker) detailMarker.setMap(null);
    detailMarker = new kakao.maps.Marker({ map: detailMap, position, title: place.title });
    setTimeout(() => {
        detailMap.relayout();
        detailMap.setCenter(position);
    }, 80);
    refineKakaoPlacePosition(query, refinedPlace => {
        const refinedPosition = makeLatLng(refinedPlace);
        detailMap.setCenter(refinedPosition);
        if (detailMarker) detailMarker.setMap(null);
        detailMarker = new kakao.maps.Marker({ map: detailMap, position: refinedPosition, title: refinedPlace.title });
    });
}

function renderBookKakaoMap(query) {
    if (!kakaoReady) return;
    const el = document.getElementById('bookKakaoMap');
    if (!el) return;
    const place = resolvePlace(query);
    const position = makeLatLng(place);
    if (!bookMap) {
        bookMap = new kakao.maps.Map(el, { center: position, level: 4 });
    } else {
        bookMap.setCenter(position);
    }
    if (bookMarker) bookMarker.setMap(null);
    bookMarker = new kakao.maps.Marker({ map: bookMap, position, title: place.title });
    setTimeout(() => {
        bookMap.relayout();
        bookMap.setCenter(position);
    }, 80);
    refineKakaoPlacePosition(query, refinedPlace => {
        const refinedPosition = makeLatLng(refinedPlace);
        bookMap.setCenter(refinedPosition);
        if (bookMarker) bookMarker.setMap(null);
        bookMarker = new kakao.maps.Marker({ map: bookMap, position: refinedPosition, title: refinedPlace.title });
    });
}

function refineKakaoPlacePosition(query, callback) {
    if (!query) return;
    const key = String(query).includes('감자') || String(query).includes('신샘밭') || String(query).includes('신북읍') || String(query).toLowerCase().includes('gamja')
            ? 'gamja'
            : String(query).includes('강릉') || String(query).includes('경포') || String(query).toLowerCase().includes('gangneung')
            ? 'gangneung'
            : String(query).includes('문배') || String(query).toLowerCase().includes('makgeolli')
            ? 'makgeolli'
            : String(query).includes('오시드래요') || String(query).toLowerCase().includes('gukbap')
                ? 'gukbap'
                : 'chuncheon';
    if (isCoordinateLocked(key)) {
        callback(KAKAO_PLACES[key]);
        return;
    }
    if (!kakaoPlacesService && !kakaoGeocoder) return;
    const addressList = KAKAO_PLACE_ADDRESSES[key] || [];
    const exactKeywordList = KAKAO_PLACE_EXACT_KEYWORDS[key] || [];
    const keywordList = [query, ...(KAKAO_PLACE_KEYWORDS[key] || [])];
    searchKakaoKeyword(key, exactKeywordList, exactPlace => {
        callback({
            lat: Number(exactPlace.y),
            lng: Number(exactPlace.x),
            title: exactPlace.place_name || KAKAO_PLACES[key]?.title || query
        });
    }, () => {
        searchKakaoAddress(addressList, result => {
            callback({
                lat: Number(result.y),
                lng: Number(result.x),
                title: KAKAO_PLACES[key]?.title || query
            });
        }, () => {
            searchKakaoKeyword(key, keywordList, place => {
                callback({
                    lat: Number(place.y),
                    lng: Number(place.x),
                    title: place.place_name || query
                });
            });
        });
    });
}

/* 데모용 Google 및 이메일 로그인 동작입니다. 실제 인증 API는 아직 연결되지 않았습니다. */
function loginWithGoogle() {
    saveAuth({
        provider: 'google',
        name: 'Traveler',
        handle: '@traveler'
    });
    showToast('Signed in with Google.');
    changeScreen('mainScreen');
}

function loginWithEmail(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    if (!password) { showToast('Please enter your password.', false); return; }
    saveAuth({
        provider: 'email',
        name: email,
        email,
        handle: makeHandle(email)
    });
    event.target.reset();
    showToast('Signed in with email.');
    changeScreen('mainScreen');
}

/* Lens Talk의 스토리, 검색, 좋아요, 위치 지도 화면을 처리합니다. */
function openStory(card) {
    const storyFrame = document.getElementById('storyFrame');
    const word = card.dataset.word || 'Culture Word';
    const user = card.dataset.user || '@culturelens';
    const map = card.dataset.map || card.dataset.place || 'Korea';
    storyFrame.style.setProperty('--story-img', `url('${card.dataset.img}')`);
    document.getElementById('storyUser').innerText = user;
    document.getElementById('storyWord').innerText = word;
    activeStoryMapQuery = map;
    document.getElementById('storyLikeBtn').classList.remove('liked');
    changeScreen('storyScreen');
}

function setCommunitySearch(value) {
    const input = document.getElementById('communitySearchInput');
    if (!input) return;
    input.value = value;
    filterCommunity();
}

function filterCommunity() {
    const input = document.getElementById('communitySearchInput');
    const q = (input && input.value || '').trim().toLowerCase();
    document.querySelectorAll('#communityScreen .talk-card').forEach(card => {
        const haystack = `${card.dataset.search || ''} ${card.dataset.word || ''} ${card.dataset.user || ''} ${card.dataset.place || ''}`.toLowerCase();
        card.style.display = !q || haystack.includes(q) ? '' : 'none';
    });
}

function toggleStoryLike() {
    document.getElementById('storyLikeBtn').classList.toggle('liked');
}

function openMapView(query, title = "Photo location", returnScreen = "storyScreen") {
    mapReturnScreen = returnScreen;
    document.getElementById('mapTitle').innerText = title;
    document.getElementById('mapSubtitle').innerText = "Where this photo was captured";
    const returnIcon = document.getElementById('mapReturnIcon');
    const returnBtn = document.getElementById('mapReturnBtn');
    if (returnIcon) {
        returnIcon.className = returnScreen === 'mainScreen' ? 'fa-solid fa-house' : 'fa-solid fa-book-open';
    }
    if (returnBtn) {
        returnBtn.setAttribute('aria-label', returnScreen === 'mainScreen' ? 'Back to home' : 'Back to card');
    }
    changeScreen('mapScreen');
    renderDetailKakaoMap(query);
}

function openMapFromStory() {
    openMapView(activeStoryMapQuery, "Story location", "storyScreen");
}

function closeMapView() {
    changeScreen(mapReturnScreen);
}

/* ════════════════════════════════════════════════════════
   카메라 스캔과 문화 분석 결과 표시
   ════════════════════════════════════════════════════════ */
function toggleCameraSample() {
    activeSampleIdx = (activeSampleIdx + 1) % mockCultureData.length;
    const n = String(activeSampleIdx + 1).padStart(2, '0');
    document.getElementById('sampleLabel').innerText = `SAMPLE ${n}`;
    setCameraTargetGuide();
}
function setCameraTargetGuide() {
    const t = mockCultureData[activeSampleIdx];
    document.getElementById('cameraSampleImg').src = t.img;
    document.getElementById('targetWordOverlay').innerText = t.krBase;
}

function updateHomeCountry() {
    const homeSelect = document.getElementById('homeCountrySelect');
    if (!homeSelect) return;
    setTweak('country', homeSelect.value);
    showToast(`Lens set: ${COUNTRY_META[homeCountry].flag} ${homeCountry}`);
}

function updateFlagAndBadges() {
    const m = COUNTRY_META[homeCountry];
    if (!m) return;
    const homeFlag = document.getElementById('flagEmoji');
    if (homeFlag) homeFlag.innerText = m.flag;
    const settingsFlag = document.getElementById('settingsFlagEmoji');
    if (settingsFlag) settingsFlag.innerText = m.flag;
}

function simulateScan() {
    /*
     * [백엔드 / LLM API 연동 예정 영역]
     * 현재는 실제 API 호출 코드를 넣지 않고 비워둔 상태입니다.
     *
     * 연결할 API: POST /api/v1/context/translate
     * 요청 데이터: word, user_id, language, country
     * 응답 데이터: history, modern_shift, analogy
     *
     * 프론트 화면 연결 기준:
     * - word: 현재 인식한 한국어 단어
     * - history + modern_shift: 카드 뒷면의 Meaning(shortDef)
     * - analogy: 선택한 국가의 Lens(cultureMatch[homeCountry])
     *
     * FastAPI에서 이 HTML도 함께 제공하면 상대 주소로 호출할 수 있습니다.
     * Google API 키는 HTML에 넣지 않고 백엔드의 .env에서만 관리합니다.
     */

    // 아래는 API 연동 전에도 화면을 확인할 수 있도록 남겨둔 데모용 동작입니다.
    // mockCultureData와 COMPARISONS의 샘플 값을 실제 응답처럼 화면에 표시합니다.
    const t = mockCultureData[activeSampleIdx];
    const cmp = COMPARISONS[t.krBase] && COMPARISONS[t.krBase][homeCountry] || "Comparative analysis preparing…";

    document.getElementById('scanLaser').style.display = 'none';
    document.getElementById('preScanState').style.display = 'none';
    document.getElementById('postScanState').classList.add('active');

    const krParts = t.kr.match(/^(.+?)\s*\((.+)\)$/);
    document.getElementById('detectedWordKr').innerHTML = krParts ? `${krParts[1]} (<em>${krParts[2]}</em>)` : t.kr;
    document.getElementById('wordEngConcept').innerText = t.eng;
    document.getElementById('cultureMatchDesc').innerText = cmp;
    document.getElementById('targetCountryBadge').innerText = COUNTRY_META[homeCountry].lensLabel;

    scannedData = {
        kr: t.kr,
        krBase: t.krBase,
        eng: t.eng,
        desc: cmp,
        tags: ["#K-culture", "#travel", "#word"],
        // 카드 뒷면의 Meaning에는 shortDef, 국가별 Lens에는 cultureMatch[homeCountry]가 표시됩니다.
        shortDef: t.eng,
        cultureMatch: { [homeCountry]: cmp },
        img: t.img,
        date: t.date,
        targetCountry: homeCountry
    };

    document.getElementById('saveBtn').classList.add('visible');
    document.getElementById('dummySaveSpace').style.display = 'none';
    const badge = document.getElementById('scanStatusBadge');
    badge.className = 'cam-status-pill done';
    badge.textContent = 'SCAN COMPLETE';
}

/* ════════════════════════════════════════════════════════
   Culture Book 폴더 목록, 상세 카드, 커뮤니티 업로드
   ════════════════════════════════════════════════════════ */
function renderFolderList() {
    const c = document.getElementById('folderListContainer');
    c.innerHTML = "";
    Object.keys(cultureFolders).forEach(id => {
        const f = cultureFolders[id];
        const div = document.createElement('div');
        div.className = 'folder-card';
        div.onclick = () => openFolderDetail(id);
        const icon = f.type === 'route' ? 'route' : (f.type === 'food' ? 'utensils' : 'umbrella-beach');
        const activeMark = id === currentActiveFolderId ? '<span class="active-dot" title="Active"></span>' : '<span style="font-family:var(--mono);font-size:9px;letter-spacing:0.16em;color:var(--ink-4);">' + String(f.cards.length).padStart(2,'0') + '</span>';
        div.innerHTML = `
            <div class="thumb"><i class="fa-solid fa-${icon}"></i></div>
            <div class="body">
                <div class="title">${f.title}</div>
                <div class="meta">${f.cards.length} cards · ${f.season || '—'}</div>
            </div>
            <div class="right">${activeMark}<i class="fa-solid fa-chevron-right" style="color:var(--ink-4);font-size:10px"></i></div>
        `;
        c.appendChild(div);
    });
}

function updateStats() {
    const total = Object.values(cultureFolders).reduce((s, f) => s + f.cards.length, 0);
    document.getElementById('statTotal').innerHTML = `<em>${String(total).padStart(2,'0')}</em>`;
    const sc = document.getElementById('settingsCardCount');
    if (sc) sc.innerText = String(total).padStart(2,'0');
}

function openFolderDetail(id) {
    currentActiveFolderId = id;
    currentDetailCardIdx = 0;
    isFlipped = false;
    selectedCommunityCard = null;
    communityUploadSelectMode = false;
    const f = cultureFolders[id];
    const titleEl = document.getElementById('folderDetailTitle');
    titleEl.innerHTML = f.title.replace(/^(\S+)/, '<em>$1</em>');
    updateDetailCardView();
    changeScreen('bookDetailScreen');
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

function updateDetailCardView() {
    const f = cultureFolders[currentActiveFolderId];
    const cards = f.cards;
    const track = document.getElementById('carouselTrack');
    const pager = document.getElementById('carouselPager');
    track.innerHTML = '';
    pager.innerHTML = '';

    if (cards.length === 0) {
        track.innerHTML = `
            <div class="carousel-empty" style="width:100%;min-width:100%">
                <div class="ico"><i class="fa-solid fa-camera"></i></div>
                <h5>No cards yet</h5>
                <p>Open the camera lens and scan your first Korean culture word. This trip will become a small book of discoveries.</p>
            </div>`;
        document.getElementById('cardNavLabel').innerText = '0 / 0';
        return;
    }

    cards.forEach((card, i) => {
        const krParts = card.kr.match(/^(.+?)\s*\((.+)\)$/);
        const fmt = krParts ? `${krParts[1]} (<em>${krParts[2]}</em>)` : card.kr;
        const country = card.targetCountry ? COUNTRY_META[card.targetCountry].short : 'USA';
        const counter = `#${String(i + 1).padStart(2,'0')} / ${String(cards.length).padStart(2,'0')}`;
        const mapQuery = card.mapQuery || card.place || `${card.krBase} Korea`;
        const mapTitle = card.place || card.krBase;
        const tags = (card.tags && card.tags.length ? card.tags : ["#K-culture", "#travel", "#word"])
            .map(tag => `<span>${escapeHtml(tag)}</span>`)
            .join('');
        const shortDef = card.shortDef || card.eng || "A Korean culture word captured through the lens.";
        const match = card.cultureMatch && card.cultureMatch[homeCountry]
            ? card.cultureMatch[homeCountry]
            : (card.desc || "A short comparison will be prepared for your culture lens.");
        const uploadKey = cardUploadKey(i, card);
        const isUploadChecked = selectedCommunityCard === uploadKey;

        const el = document.createElement('div');
        el.className = 'carousel-card';
        el.classList.toggle('show-upload-check', communityUploadSelectMode);
        el.dataset.idx = i;
        el.dataset.uploadKey = uploadKey;
        el.innerHTML = `
            <button class="card-upload-check ${isUploadChecked ? 'checked' : ''}" type="button" aria-label="Select this card for Lens Talk upload">
                <i class="fa-solid fa-check"></i>
            </button>
            <div class="flashcard-inner">
                <div class="flashcard-face flashcard-front">
                    <div class="photo-frame">
                        <img src="${card.img}" alt="" draggable="false">
                        <div class="chip-row">
                            <span class="ch">Culture Shot</span>
                            <span class="ch date">${card.date}</span>
                        </div>
                    </div>
                    <div class="caption-strip">
                        <h4>${fmt}</h4>
                    </div>
                </div>
                <div class="flashcard-face flashcard-back">
                    <div class="head">
                        <span class="type-tag">${country} · COMPARATIVE STUDY</span>
                        <span class="flip-mark"><i class="fa-solid fa-rotate"></i> FLIP</span>
                    </div>
                    <div class="body-text">
                        <h4>${fmt}</h4>
                        <div class="tag-row">${tags}</div>
                        <div class="meaning-box">
                            <span class="label">Meaning</span>
                            <span class="text">${escapeHtml(shortDef)}</span>
                        </div>
                        <div class="culture-match-box">
                            <span class="label">${COUNTRY_META[homeCountry]?.short || 'Your'} Lens</span>
                            <span class="text">${escapeHtml(match)}</span>
                        </div>
                    </div>
                    <div class="foot">
                        <span>Archive</span>
                        <span class="counter">${counter}</span>
                    </div>
                </div>
            </div>`;

        // 현재 카드는 앞뒤로 뒤집고, 옆 카드는 선택 위치로 이동합니다.
        el.addEventListener('click', (event) => {
            if (event.target.closest('.body-text') || event.target.closest('.card-upload-check')) return;
            const idx = parseInt(el.dataset.idx, 10);
            if (idx === currentDetailCardIdx) el.classList.toggle('is-flipped');
            else scrollToCard(idx);
        });
        el.querySelector('.card-upload-check').addEventListener('click', (event) => {
            event.stopPropagation();
            selectedCommunityCard = uploadKey;
            currentDetailCardIdx = i;
            scrollToCard(i);
            updateCommunitySelectionUI();
            updateCommunityUploadButton();
        });
        track.appendChild(el);

        const dot = document.createElement('span');
        dot.className = 'dot' + (i === currentDetailCardIdx ? ' on' : '');
        dot.onclick = () => scrollToCard(i);
        pager.appendChild(dot);
    });

    requestAnimationFrame(() => {
        scrollToCard(currentDetailCardIdx, false);
        // 스크롤 위치가 바뀌지 않아도 첫 카드를 선택 상태로 표시합니다.
        updateActiveCardFromScroll();
        updateBookMapBackground();
    });
    updateCardCounter();
}

function scrollToCard(idx, smooth = true) {
    const track = document.getElementById('carouselTrack');
    const card = track.children[idx];
    if (!card) return;
    const target = card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2;
    track.scrollTo({ left: target, behavior: smooth ? 'smooth' : 'instant' });
}

function updateActiveCardFromScroll() {
    const track = document.getElementById('carouselTrack');
    if (!track || track.children.length === 0) return;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let nearest = 0, nearestDist = Infinity;
    Array.from(track.children).forEach((card, i) => {
        if (!card.dataset.idx) return;
        const cm = card.offsetLeft + card.offsetWidth / 2;
        const d = Math.abs(cm - mid);
        if (d < nearestDist) { nearestDist = d; nearest = i; }
    });
    if (nearest !== currentDetailCardIdx) {
        const prev = track.children[currentDetailCardIdx];
        if (prev) prev.classList.remove('is-flipped');
    }
    currentDetailCardIdx = nearest;
    Array.from(track.children).forEach((card, i) => card.classList.toggle('is-active', i === nearest));
    const dots = document.getElementById('carouselPager').children;
    Array.from(dots).forEach((d, i) => d.classList.toggle('on', i === nearest));
    updateBookMapBackground();
    updateCardCounter();
    updateCommunityUploadButton();
}

function updateCardCounter() {
    const f = cultureFolders[currentActiveFolderId];
    const len = f ? f.cards.length : 0;
    document.getElementById('cardNavLabel').innerText = len === 0 ? '0 / 0' : `${currentDetailCardIdx + 1} / ${len}`;
    updateCommunityUploadButton();
}

function getCurrentDetailCard() {
    const f = cultureFolders[currentActiveFolderId];
    return f && f.cards[currentDetailCardIdx];
}

function cardUploadKey(idx, card) {
    return `${currentActiveFolderId}:${idx}:${card.krBase || card.kr}`;
}

function currentCardUploadKey() {
    const card = getCurrentDetailCard();
    return card ? cardUploadKey(currentDetailCardIdx, card) : '';
}

function getSelectedCommunityCard() {
    if (!selectedCommunityCard) return null;
    const f = cultureFolders[currentActiveFolderId];
    if (!f) return null;
    const parts = selectedCommunityCard.split(':');
    const idx = Number(parts[1]);
    const card = Number.isInteger(idx) ? f.cards[idx] : null;
    return card ? { card, idx } : null;
}

function updateCommunitySelectionUI() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    Array.from(track.children).forEach(cardEl => {
        if (!cardEl.dataset.idx) return;
        cardEl.classList.toggle('show-upload-check', communityUploadSelectMode);
        const check = cardEl.querySelector('.card-upload-check');
        if (check) check.classList.toggle('checked', selectedCommunityCard === cardEl.dataset.uploadKey);
    });
}

function updateCommunityUploadButton() {
    const btn = document.getElementById('communityUploadBtn');
    const card = getCurrentDetailCard();
    if (!btn) return;
    if (!card) {
        btn.style.display = 'none';
        btn.disabled = false;
        return;
    }
    btn.style.display = 'flex';
    const selected = getSelectedCommunityCard();
    const isReady = communityUploadSelectMode && Boolean(selected);
    btn.classList.toggle('ready', isReady);
    btn.disabled = communityUploadSelectMode && !isReady;
    btn.innerHTML = communityUploadSelectMode
        ? '<i class="fa-solid fa-upload"></i> 업로드'
        : '<i class="fa-solid fa-check"></i> 선택하기';
    updateCommunitySelectionUI();
}

function handleCommunityUploadAction() {
    const card = getCurrentDetailCard();
    if (!card) return;
    if (!communityUploadSelectMode) {
        communityUploadSelectMode = true;
        selectedCommunityCard = null;
        updateCommunityUploadButton();
        return;
    }
    const selected = getSelectedCommunityCard();
    if (!selected) return;
    uploadCurrentCardToCommunity(selected.card);
}

function uploadCurrentCardToCommunity(card) {
    const grid = document.querySelector('#communityScreen .community-grid');
    if (!grid) return;
    const word = card.krBase || card.kr || 'Culture Shot';
    const place = card.place || 'Korea';
    const map = card.mapQuery || place;
    const img = card.img || '';
    const btn = document.createElement('button');
    btn.className = 'talk-card';
    btn.type = 'button';
    btn.onclick = function () { openStory(this); };
    btn.dataset.search = `${word} ${place} uploaded community culture book`.toLowerCase();
    btn.dataset.user = currentUser?.handle || '@guest';
    btn.dataset.word = word;
    btn.dataset.place = place;
    btn.dataset.map = map;
    btn.dataset.img = img;
    btn.style.setProperty('--talk-img', `url('${img}')`);
    btn.innerHTML = `
        <span class="word">${escapeHtml(word)}</span>
        <span class="meta">${escapeHtml((currentUser?.handle || '@guest').replace('@', ''))} · Uploaded</span>
    `;
    grid.prepend(btn);
    selectedCommunityCard = null;
    communityUploadSelectMode = false;
    updateCommunityUploadButton();
    showToast('Uploaded to Lens Talk.');
    changeScreen('communityScreen');
}

function updateBookMapBackground() {
    const card = getCurrentDetailCard();
    const btn = document.getElementById('bookMapOpenBtn');
    if (!btn) return;
    if (!card) {
        btn.style.display = 'none';
        renderBookKakaoMap('Chuncheon Korea');
        return;
    }
    const query = card.mapQuery || card.place || `${card.krBase} Korea`;
    btn.style.display = 'inline-flex';
    renderBookKakaoMap(query);
}

function openCurrentCardMap() {
    const card = getCurrentDetailCard();
    if (!card) return;
    openMapView(card.mapQuery || card.place || `${card.krBase} Korea`, card.place || card.krBase, 'bookDetailScreen');
}

/* 카드 좌우 스크롤과 이전 및 다음 카드 이동 처리 */
function setupCarousel() {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    track.addEventListener('scroll', () => updateActiveCardFromScroll());
}

function navigateCard(dir) {
    const f = cultureFolders[currentActiveFolderId];
    const len = f.cards.length;
    if (len === 0) return;
    const next = Math.max(0, Math.min(len - 1, currentDetailCardIdx + dir));
    scrollToCard(next);
}
/* ════════════════════════════════════════════════════════
   저장 폴더 선택, 새 폴더 생성, 설정 모달
   ════════════════════════════════════════════════════════ */
function openSaveModal() {
    if (!scannedData) return;
    document.getElementById('modalTargetName').innerText = scannedData.krBase;
    renderModalFolders();
    document.getElementById('saveModal').classList.add('active');
}
function closeSaveModal() { document.getElementById('saveModal').classList.remove('active'); }
function renderModalFolders() {
    const c = document.getElementById('modalFolderList');
    c.innerHTML = "";
    Object.keys(cultureFolders).forEach(id => {
        const f = cultureFolders[id];
        const div = document.createElement('div');
        div.className = 'opt';
        div.onclick = () => saveCardToFolder(id);
        const icon = f.type === 'route' ? 'route' : (f.type === 'food' ? 'utensils' : 'umbrella-beach');
        div.innerHTML = `
            <div class="l">
                <i class="fa-solid fa-${icon}"></i>
                <span class="nm">${f.title}</span>
            </div>
            <span class="ct">${String(f.cards.length).padStart(2,'0')} CARDS</span>
        `;
        c.appendChild(div);
    });
}
function saveCardToFolder(id) {
    if (!scannedData) return;
    cultureFolders[id].cards.unshift({ ...scannedData });
    closeSaveModal();
    showToast(`'${scannedData.krBase}' was saved to [${cultureFolders[id].title}].`);
    setTimeout(() => openFolderDetail(id), 600);
}

function openNewFolderModal()       { pendingFolderTriggerMode = "list"; document.getElementById('newFolderModal').classList.add('active'); setTimeout(() => document.getElementById('newFolderNameInput').focus(), 100); }
function openNewFolderModalFromModal() { pendingFolderTriggerMode = "modal"; document.getElementById('newFolderModal').classList.add('active'); setTimeout(() => document.getElementById('newFolderNameInput').focus(), 100); }
function closeNewFolderModal()      {
    document.getElementById('newFolderModal').classList.remove('active');
    document.getElementById('newFolderNameInput').value = "";
    document.getElementById('newFolderStartDateInput').value = "";
    document.getElementById('newFolderEndDateInput').value = "";
}
function formatTripDate(value) {
    return value.replaceAll('-', '.');
}
function formatTripRange(startDate, endDate) {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const dayMs = 24 * 60 * 60 * 1000;
    const nights = Math.round((end - start) / dayMs);
    const days = nights + 1;
    return `${formatTripDate(startDate)} ~ ${formatTripDate(endDate)} · ${nights}박 ${days}일 여행`;
}
function submitNewFolder() {
    const name = document.getElementById('newFolderNameInput').value.trim();
    const startDate = document.getElementById('newFolderStartDateInput').value;
    const endDate = document.getElementById('newFolderEndDateInput').value;
    if (!name) { showToast("Please enter a culture book title.", false); return; }
    if (!startDate || !endDate) { showToast("Please choose trip dates.", false); return; }
    if (new Date(endDate) < new Date(startDate)) { showToast("End date must be after start date.", false); return; }
    const id = "f_" + Date.now();
    cultureFolders[id] = { title: name, type: "route", season: formatTripRange(startDate, endDate), cards: [] };
    closeNewFolderModal();
    showToast("New culture book created.");
    if (pendingFolderTriggerMode === "modal") renderModalFolders();
    else renderFolderList();
    updateStats();
}

function openSettings()  { document.getElementById('settingsModal').classList.add('active'); }
function closeSettingsModal() { document.getElementById('settingsModal').classList.remove('active'); }
function openDubaiCookieCard() { document.getElementById('dubaiCookieModal').classList.add('active'); }
function closeDubaiCookieCard() { document.getElementById('dubaiCookieModal').classList.remove('active'); }

/* ════════════════════════════════════════════════════════
   화면 아래에 잠깐 표시되는 완료 및 오류 알림
   ════════════════════════════════════════════════════════ */
let toastTimer = null;
function showToast(msg, ok = true) {
    const t = document.getElementById('toastNotification');
    document.getElementById('toastMessage').innerText = msg;
    t.querySelector('.icon i').className = ok ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-exclamation';
    t.querySelector('.icon').style.color = ok ? 'oklch(75% 0.1 145)' : 'oklch(70% 0.15 25)';
    t.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

/* 모달 바깥의 어두운 배경을 누르면 해당 모달을 닫습니다. */
document.addEventListener('click', (e) => {
    if (e.target.id === 'saveModal') closeSaveModal();
    if (e.target.id === 'newFolderModal') closeNewFolderModal();
    if (e.target.id === 'settingsModal') closeSettingsModal();
    if (e.target.id === 'dubaiCookieModal') closeDubaiCookieCard();
});

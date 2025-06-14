// public/script.js

let cart = [];

const pcMainCategories = [
    "CPU",
    "쿨러/튜닝",
    "메인보드",
    "메모리",
    "그래픽카드",
    "SSD",
    "HDD",
    "케이스",
    "파워",
    "조립비",
    "소프트웨어"
];

const pcMainCategoryKeys = pcMainCategories.map(cat => cat.toLowerCase().replace(/\s/g, ''));

const cartCategoriesDiv = document.getElementById("cart-categories");
const cartItemsDiv = document.getElementById("cart-items"); // 총 견적 금액만 표시할 영역

// PC 주요구성 아코디언의 content div를 저장할 전역 변수
let pcMainAccordionContent = null;
let currentSortOrder = "C.pd_suggest desc,C.pd_sold desc"; // 기본 정렬 순서: 인기상품순

// 상품 설명 팝업 관련 요소 가져오기
const specPopupOverlay = document.getElementById("specPopupOverlay");
const popupProductName = document.getElementById("popupProductName");
const popupProductSpec = document.getElementById("popupProductSpec");
const popupCloseBtn = document.querySelector(".spec-popup-close-btn");

// 팝업 열기 함수
function openSpecPopup(productName, productSpec) {
    popupProductName.textContent = productName;
    popupProductSpec.textContent = productSpec;
    specPopupOverlay.classList.add("visible");
}

// 팝업 닫기 함수
function closeSpecPopup() {
    specPopupOverlay.classList.remove("visible");
}

// 팝업 닫기 버튼 이벤트 리스너
popupCloseBtn.addEventListener("click", closeSpecPopup);
// 팝업 오버레이 클릭 시 닫기 (내부 클릭은 제외)
specPopupOverlay.addEventListener("click", (e) => {
    if (e.target === specPopupOverlay) {
        closeSpecPopup();
    }
});


// createAccordion 함수는 PC 주요구성 아코디언을 단 한 번만 생성하고,
// 그 내부에 세부 카테고리 버튼들을 초기화 시점에 모두 그립니다.
function createAccordion() {
    const container = document.createElement("div");
    container.className = "accordion-category";

    const header = document.createElement("div");
    header.className = "accordion-header";
    header.textContent = "PC 주요구성";

    // PC 주요구성 아코디언의 내용이 들어갈 div를 전역 변수에 할당
    pcMainAccordionContent = document.createElement("div");
    pcMainAccordionContent.className = "accordion-content";
    pcMainAccordionContent.id = "pc-main-accordion-content"; // ID 부여

    // 헤더 클릭 시 아코디언 내용 토글 (세부 카테고리 버튼과 상품 목록이 모두 포함된 영역)
    header.addEventListener("click", () => {
        header.classList.toggle("open"); // 헤더에 open 클래스 토글 (꺽쇠 방향 변경용)
        pcMainAccordionContent.classList.toggle("open");
    });

    container.appendChild(header);
    container.appendChild(pcMainAccordionContent); // 아코디언 콘텐츠 추가

    cartCategoriesDiv.appendChild(container); // cart-categories div에 PC 주요구성 아코디언 추가

    // --- PC 주요구성 아코디언 내부에 세부 카테고리별 Wrapper div 생성 (이 안에 버튼과 상품 목록이 들어감) ---
    pcMainCategories.forEach((cat, idx) => {
        const categoryBlock = document.createElement("div"); // 이미지의 'CPU', '쿨러/튜닝' 블록
        categoryBlock.className = "pc-main-category-block";
        categoryBlock.id = `category-block-${pcMainCategoryKeys[idx]}`; // ID 부여

        // 카테고리 헤더 (빨간색 배경의 'CPU', '쿨러/튜닝' 부분)
        const categoryHeader = document.createElement("div");
        categoryHeader.className = "category-header"; // 새로운 클래스
        categoryHeader.textContent = cat;
        categoryHeader.dataset.key = pcMainCategoryKeys[idx]; // 데이터 키 추가
        categoryHeader.addEventListener("click", () => {
            selectCategory(pcMainCategoryKeys[idx]); // 클릭 시 해당 카테고리 선택 및 공백 검색
        });
        categoryBlock.appendChild(categoryHeader);

        // 이 아래에 상품 목록이 동적으로 추가될 영역
        const productListForCategory = document.createElement("div");
        productListForCategory.className = "product-list-for-category";
        productListForCategory.id = `product-list-${pcMainCategoryKeys[idx]}`;
        categoryBlock.appendChild(productListForCategory);

        pcMainAccordionContent.appendChild(categoryBlock);
    });

    // --- 초기 로드 시 설정 ---
    // 1. PC 주요구성 아코디언 펼치기
    header.classList.add("open"); // 헤더도 열림 상태로
    pcMainAccordionContent.classList.add("open");

    // 2. CPU 카테고리 선택 및 초기 공백 검색 수행
    const initialCategoryKey = "cpu"; // "cpu"를 초기 선택 카테고리로 설정
    selectCategory(initialCategoryKey); // selectCategory 함수는 이제 항상 공백으로 검색을 실행함

    // 초기 로드 시 장바구니에 상품이 있을 경우를 대비하여 renderCart 호출
    renderCart();
}

let selectedCategory = null;

async function selectCategory(key) {
    selectedCategory = key;

    // 모든 카테고리 헤더의 활성화 상태 초기화
    const categoryHeaders = pcMainAccordionContent.querySelectorAll(".category-header");
    categoryHeaders.forEach(b => {
        b.classList.remove("active");
    });
    // 현재 선택된 헤더 활성화
    const currentHeader = pcMainAccordionContent.querySelector(`.category-header[data-key="${key}"]`);
    if (currentHeader) {
        currentHeader.classList.add("active");
    }

    // 각 세부 카테고리 선택 시, cmd는 항상 빈 문자열로 넘겨 인기상품을 가져오도록 함.
    // 기존 검색어와 현재 정렬 순서를 유지하도록 변경
    const currentCmd = document.getElementById("cmd").value.trim();
    await searchProducts(currentCmd, key, currentSortOrder);
}
async function searchProducts(cmd, categoryKey, sortOrder) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "검색 중..."; // 기존 내용 초기화

    try {
        const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cmd: cmd, category: "주요구성", detail: categoryKey, list_order: sortOrder })
        });

        const data = await res.json();

        if (data.error || !data.products || data.products.length === 0) {
            resultDiv.innerHTML = `<p>${data.error || "검색 결과 없음"}</p>`;
            return;
        }

        // 템플릿 리터럴을 사용하여 각 상품의 HTML을 생성합니다.
        // 이 부분에서 p.spec이 한 번만 사용되는지 다시 확인합니다.
        resultDiv.innerHTML = data.products
            .map(
                (p) => `
        <div class="product">
          <img src="${p.image}" alt="${p.name}" /> <div class="info">
            <h3>${p.name}</h3>
            <p class="product-spec" title="${p.spec.replace(/"/g, '&quot;')}" data-full-spec="${p.spec.replace(/"/g, '&quot;')}">${p.spec}</p>
          </div>
          <div class="product-actions">
            <strong>${Number(p.price).toLocaleString()}원</strong>
            <button onclick='addToCart(${JSON.stringify(p)}, "${categoryKey}")'>담기 →</button>
          </div>
        </div>
      `
            )
            .join("");

        // 상품 설명 클릭 이벤트 리스너 추가 (새로 생성된 요소에)
        document.querySelectorAll(".product .info .product-spec").forEach(specP => {
            specP.addEventListener("click", (e) => {
                const productName = e.target.closest(".product").querySelector("h3").textContent;
                const fullSpec = e.target.dataset.fullSpec; // data-full-spec 속성에서 전체 설명 가져옴
                openSpecPopup(productName, fullSpec);
            });
        });

    } catch (err) {
        resultDiv.innerHTML = `<p>검색 중 오류가 발생했습니다: ${err.message}</p>`;
    }
}
/*
async function searchProducts(cmd, categoryKey, sortOrder) {
    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "검색 중...";

    try {
        const res = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // 여기에서 'detail' 파라미터에 categoryKey (예: 'cpu')를 정확히 전달합니다.
            body: JSON.stringify({ cmd: cmd, category: "주요구성", detail: categoryKey, list_order: sortOrder })
        });

        const data = await res.json();

        if (data.error || !data.products || data.products.length === 0) {
            resultDiv.innerHTML = `<p>${data.error || "검색 결과 없음"}</p>`;
            return;
        }

        resultDiv.innerHTML = data.products
            .map(
                (p) => `
        <div class="product">
          <img src="${p.image}" />
          <div class="info">
            <h3>${p.name}</h3>
            <p class="product-spec" title="${p.spec.replace(/"/g, '&quot;')}" data-full-spec="${p.spec.replace(/"/g, '&quot;')}">${p.spec}</p>
          </div>
          <div class="product-actions"> <strong>${Number(p.price).toLocaleString()}원</strong>
            <button onclick='addToCart(${JSON.stringify(p)}, "${categoryKey}")'>담기 →</button>
          </div>
        </div>
      `
            )
            .join("");

        // 상품 설명 클릭 이벤트 리스너 추가 (새로 생성된 요소에)
        document.querySelectorAll(".product .info .product-spec").forEach(specP => {
            specP.addEventListener("click", (e) => {
                const productName = e.target.closest(".product").querySelector("h3").textContent;
                const fullSpec = e.target.dataset.fullSpec;
                openSpecPopup(productName, fullSpec);
            });
        });

    } catch (err) {
        resultDiv.innerHTML = `<p>검색 중 오류가 발생했습니다: ${err.message}</p>`; // 에러 메시지 추가
    }
}
*/
function addToCart(product, categoryKey) {
    // 상품 이름과 카테고리 키가 모두 일치해야 같은 상품으로 간주 (중복 방지 및 수량 증가)
    const found = cart.find(p => p.name === product.name && p.category === categoryKey);
    if (found) {
        found.quantity++;
    } else {
        cart.push({ ...product, quantity: 1, category: categoryKey });
    }
    renderCart(); // 장바구니에 담으면 바로 렌더링
}

// renderCart 함수 수정: PC 주요구성 아코디언 내부에 세부 카테고리별로 상품을 그립니다.
function renderCart() {
    if (!pcMainAccordionContent) {
        // pcMainAccordionContent가 아직 생성되지 않았으면 잠시 기다렸다가 다시 시도
        setTimeout(renderCart, 50);
        return;
    }

    // 장바구니 내 모든 카테고리 블록의 상품 목록을 초기화합니다.
    pcMainCategoryKeys.forEach(catKey => {
        const productListForCategory = document.getElementById(`product-list-${catKey}`);
        if (productListForCategory) {
            productListForCategory.innerHTML = ""; // 각 카테고리별 상품 목록 비우기
        }
    });

    // 장바구니 총 견적 금액만 표시할 영역은 비우고 다시 채웁니다.
    cartItemsDiv.innerHTML = "";


    // 각 세부 카테고리별로 상품 렌더링
    pcMainCategories.forEach((cat, i) => {
        const catKey = pcMainCategoryKeys[i];
        const productListForCategory = document.getElementById(`product-list-${catKey}`); // 해당 카테고리의 상품 목록 div

        // 해당 카테고리에 담긴 상품만 필터링
        const items = cart.filter(p => p.category === catKey);

        if (productListForCategory) { // 해당 div가 존재하는지 확인
            if (items.length === 0) {
                // 해당 카테고리에 상품이 없을 때 메시지 표시 (필요에 따라)
                // productListForCategory.innerHTML = "<p>담긴 상품이 없습니다.</p>";
            } else {
                items.forEach(p => {
                    const itemDiv = document.createElement("div");
                    itemDiv.className = "cart-item-display"; // 새로운 클래스명

                    // 상품명
                    const productName = document.createElement("span");
                    productName.className = "product-name-display";
                    productName.textContent = p.name;

                    // 수량 조절 및 가격, 삭제 버튼을 담을 컨테이너
                    const controlsWrapper = document.createElement("div");
                    controlsWrapper.className = "controls-wrapper-display";

                    const qtyControls = document.createElement("div");
                    qtyControls.className = "qty-controls-display";
                    qtyControls.innerHTML = `
                        <button onclick="changeQty('${p.name}', '${p.category}', -1)">-</button>
                        <span>${p.quantity}</span>
                        <button onclick="changeQty('${p.name}', '${p.category}', 1)">+</button>
                    `;

                    const priceSpan = document.createElement("span");
                    priceSpan.className = "price-display";
                    priceSpan.innerHTML = `${Number(p.price * p.quantity).toLocaleString()}원`;

                    const deleteButton = document.createElement("button");
                    deleteButton.className = "delete-button-display";
                    deleteButton.innerHTML = "&times;"; // X 모양
                    deleteButton.onclick = () => removeFromCart(p.name, p.category);

                    controlsWrapper.appendChild(qtyControls);
                    controlsWrapper.appendChild(priceSpan);
                    controlsWrapper.appendChild(deleteButton);

                    itemDiv.appendChild(productName);
                    itemDiv.appendChild(controlsWrapper);

                    productListForCategory.appendChild(itemDiv); // 각 세부 카테고리 div에 상품 추가
                });
            }
        }
    });

    // 장바구니 총 가격 계산 및 표시 (cartItemsDiv가 아닌, main-content 아래에 장바구니 아이템들을 그렸으므로, 이제 cartItemsDiv는 총 금액만 표시)
    const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const totalDiv = document.createElement("div");
    totalDiv.className = "cart-total";
    totalDiv.innerHTML = `<h3>총 견적 금액: <strong>${total.toLocaleString()}원</strong></h3>`;
    cartItemsDiv.appendChild(totalDiv); // 총 견적 금액은 cartItemsDiv에 추가

    // 장바구니가 비었을 때 메시지 표시 (총 견적 금액 영역에 표시)
    if (cart.length === 0) {
        cartItemsDiv.innerHTML = "<p>장바구니가 비었습니다.</p>";
    }
}


function changeQty(name, category, delta) {
    const item = cart.find(p => p.name === name && p.category === category);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(p => !(p.name === name && p.category === category));
    }
    renderCart();
}

function removeFromCart(name, category) {
    cart = cart.filter(p => !(p.name === name && p.category === category));
    renderCart();
}

// 검색 폼 제출 시에는 사용자가 입력한 검색어를 사용하도록 유지
document.getElementById("searchForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const cmd = document.getElementById("cmd").value.trim(); // 사용자가 입력한 검색어

    if (!selectedCategory) {
        alert("PC 주요구성 카테고리 중 하나를 먼저 선택하세요.");
        return;
    }

    // 검색 폼 제출 시에는 사용자가 입력한 cmd 값과 현재 정렬 순서를 searchProducts 함수에 전달합니다.
    await searchProducts(cmd, selectedCategory, currentSortOrder);
});


// 정렬 버튼 이벤트 리스너 추가
document.querySelectorAll(".sort-btn").forEach(button => {
    button.addEventListener("click", async (e) => {
        // 모든 버튼의 active 클래스 제거
        document.querySelectorAll(".sort-btn").forEach(btn => btn.classList.remove("active"));
        // 클릭된 버튼에 active 클래스 추가
        e.target.classList.add("active");

        currentSortOrder = e.target.dataset.order; // 선택된 정렬 순서 업데이트
        const cmd = document.getElementById("cmd").value.trim(); // 현재 검색어 유지

        if (!selectedCategory) { // 카테고리가 선택되어 있지 않으면 경고
            alert("PC 주요구성 카테고리 중 하나를 먼저 선택하세요.");
            return;
        }
        await searchProducts(cmd, selectedCategory, currentSortOrder); // 새 정렬 순서로 검색
    });
});


// 페이지 로드 시 createAccordion() 호출 (PC 주요구성 아코디언 및 초기 버튼 생성)
createAccordion();
// renderCart()는 createAccordion() 내부에서 초기 호출됩니다.
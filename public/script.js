// public/script.js

document.addEventListener('DOMContentLoaded', () => {
    const productListElement = document.getElementById('product-list');
    const searchInput = document.getElementById('product-search-input');
    const searchButton = document.getElementById('search-button');
    const sortButtons = document.querySelectorAll('.sort-button');
    const estimateCategoriesElement = document.getElementById('estimate-categories');
    const totalEstimatePriceElement = document.getElementById('total-estimate-price');
    const paginationElement = document.querySelector('.pagination');

    // --- 모달 관련 DOM 요소 추가 ---
    const specModal = document.getElementById('spec-modal');
    const modalProductName = document.getElementById('modal-product-name');
    const modalProductSpec = document.getElementById('modal-product-spec');
    const closeButton = document.querySelector('.close-button');
    // ---------------------------------

    let currentMainCategory = "PC 주요구성"; // 초기값
    let currentSubCategoryName = "CPU"; // 초기값
    let currentSearchKeyword = "";
    let currentListOrder = "C.pd_suggest desc,C.pd_sold desc"; // 기본 인기상품순
    let currentListNum = "10";
    let currentPageNum = "1";

    // selectedComponents 객체 구조 변경: 각 항목에 quantity 추가
    const selectedComponents = {}; // { mainCategory: { subCategory: [{ id, name, price, quantity }] } }
    let expandedCategories = new Set(); // 확장된 카테고리 이름을 저장할 Set

    // 카테고리 데이터를 서버에서 가져오는 함수 (또는 클라이언트 측에 내장)
    // 여기서는 간단히 내장된 데이터를 사용한다고 가정합니다.
    // 실제 운영 시에는 서버 API를 통해 가져오는 것이 더 효율적입니다.
    const ALL_CATEGORIES_DETAIL_MAP = {
        "PC 주요구성": [
            { name: "CPU", cate1: "17", cate2: "18" },
            { name: "쿨러/튜닝", cate1: "17", cate2: "1879" },
            { name: "메인보드", cate1: "17", cate2: "20" },
            { name: "메모리", cate1: "17", cate2: "19" },
            { name: "그래픽카드", cate1: "17", cate2: "21" },
            { name: "SSD", cate1: "17", cate2: "28" },
            { name: "HDD", cate1: "17", cate2: "22" },
            { name: "케이스", cate1: "17", cate2: "24" },
            { name: "파워", cate1: "17", cate2: "25" },
            { name: "조립비", cate1: "17", cate2: "1843" },
            {
                name: "소프트웨어", cate1: "1922", isGroup: true,
                subCategories: [
                    { name: "운영체제", cate2: "1924" },
                    { name: "오피스", cate2: "1925" },
                    { name: "백신", cate2: "1926" }
                ]
            }
        ],
        "모니터 및 주변기기": [
            {
                name: "모니터", cate1: "1", isGroup: true,
                subCategories: [
                    { name: "144hz", cate2: "1914" },
                    { name: "24인치", cate2: "1911" },
                    { name: "27인치", cate2: "1912" },
                    { name: "30인치", cate2: "1913" },
                    { name: "UHD", cate2: "1915" },
                    { name: "주변기기", cate2: "2" },
                    { name: "터치모니터", cate2: "2023" }
                ]
            },
            {
                name: "키보드", cate1: "94", isGroup: true,
                subCategories: [
                    { name: "키보드", cate2: "1898" },
                    { name: "키보드/마우스", cate2: "1900" },
                    { name: "키보드용품", cate2: "1977" }
                ]
            },
            {
                name: "마우스", cate1: "94", isGroup: true,
                subCategories: [
                    { name: "마우스", cate2: "1899" },
                    { name: "마우스주변기기", cate2: "1978" },
                    { name: "마우스패드", cate2: "1903" }
                ]
            },
            { name: "스피커", cate1: "94", cate2: "1902" },
            { name: "헤드셋", cate1: "94", cate2: "1901" },
            { name: "이어폰", cate1: "94", cate2: "1960" },
            { name: "공유기/무선랜", cate1: "94", cate2: "1904" },
            {
                name: "IP공유기/허브", cate1: "94", isGroup: true,
                subCategories: [
                    { name: "주변기기-네트워크장비", cate1: "94", cate2: "1957" },
                    { name: "개인방송장비-네트워크장비", cate1: "252", cate2: "255" }
                ]
            },
            { name: "케이블", cate1: "94", cate2: "98" },
            { name: "컨트롤러", cate1: "94", cate2: "95" }
        ]
    };


    // 상품 목록을 렌더링하는 함수
    async function renderProducts() {
        const url = `/api/products?mainCategory=${currentMainCategory}&subCategory=${currentSubCategoryName}&searchKeyword=${currentSearchKeyword}&listOrder=${currentListOrder}&listNum=${currentListNum}&pageNum=${currentPageNum}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const products = await response.json();
            productListElement.innerHTML = '';

            if (products.length === 0) {
                productListElement.innerHTML = '<p>검색 결과가 없습니다.</p>';
                return;
            }

            products.forEach(product => {
                const productItem = document.createElement('div');
                productItem.className = 'product-item';
                productItem.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-info">
                        <h4>${product.name}</h4>
                        <p class="spec">${product.spec}</p>
                    </div>
                    <div class="price-add-container">  <p class="price">${parseInt(product.price).toLocaleString()} 원</p>
                        <button class="add-button"
                            data-category="${product.category}"
                            data-subcategory="${product.subCategory}"
                            data-name="${product.name}"
                            data-price="${product.price}">견적담기</button> </div>
                `;
                productListElement.appendChild(productItem);

                const specElement = productItem.querySelector('.spec');
                specElement.addEventListener('click', () => {
                    openModal(product.name, product.spec);
                });
            });
        } catch (error) {
            console.error("상품을 가져오는 중 오류 발생:", error);
            productListElement.innerHTML = '<p>상품을 로드하는 데 실패했습니다.</p>';
        }
    }

    // 모달을 열고 내용을 채우는 함수
    function openModal(productName, productSpec) {
        modalProductName.textContent = productName;
        modalProductSpec.textContent = productSpec; // pre 태그 안에 텍스트를 넣습니다.
        specModal.style.display = 'flex'; // 모달을 보이게 함 (CSS에서 flex로 중앙 정렬)
        document.body.style.overflow = 'hidden'; // 스크롤 방지
    }

    // 모달을 닫는 함수
    function closeModal() {
        specModal.style.display = 'none'; // 모달을 숨김
        document.body.style.overflow = ''; // 스크롤 허용
    }

    // 닫기 버튼 클릭 시 모달 닫기
    closeButton.addEventListener('click', closeModal);

    // 모달 외부 클릭 시 모달 닫기
    specModal.addEventListener('click', (event) => {
        if (event.target === specModal) {
            closeModal();
        }
    });

    // ESC 키를 눌렀을 때 모달 닫기
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && specModal.style.display === 'flex') {
            closeModal();
        }
    });


    // 총 합계 금액 업데이트 함수
    function updateTotalEstimatePrice() {
        let total = 0;
        for (const category in selectedComponents) {
            for (const subCategory in selectedComponents[category]) {
                selectedComponents[category][subCategory].forEach(item => {
                    total += parseInt(item.price) * item.quantity; // 수량 반영
                });
            }
        }
        totalEstimatePriceElement.textContent = `${total.toLocaleString()} 원`;
    }

    // 견적 사이드바 렌더링 함수
    function renderEstimateSidebar() {
        estimateCategoriesElement.innerHTML = ''; // 기존 사이드바 초기화

        for (const mainCatName in ALL_CATEGORIES_DETAIL_MAP) {
            const mainCatGroup = ALL_CATEGORIES_DETAIL_MAP[mainCatName];

            const groupDiv = document.createElement('div');
            groupDiv.className = 'estimate-category-group';
            // 이전에 확장되었던 카테고리인지 확인하고 클래스 추가
            if (expandedCategories.has(mainCatName)) {
                groupDiv.classList.add('expanded');
            }

            const groupHeader = document.createElement('h4');
            groupHeader.innerHTML = `
                ${mainCatName} <span class="toggle-icon">▼</span>
            `;
            // 이전에 확장되었던 카테고리인지 확인하고 클래스 추가
            if (!expandedCategories.has(mainCatName)) {
                groupHeader.classList.add('collapsed'); // 기본적으로 접힌 상태
            }
            groupDiv.appendChild(groupHeader);

            const subCategoriesContainer = document.createElement('div');
            subCategoriesContainer.className = 'estimate-sub-categories';
            groupDiv.appendChild(subCategoriesContainer);

            mainCatGroup.forEach(subCat => {
                const subCatDiv = document.createElement('div');
                subCatDiv.className = 'estimate-sub-category';
                subCatDiv.innerHTML = `<h5>${subCat.name}</h5>`;

                // --- 서브 카테고리 이름 클릭 이벤트 추가 시작 ---
                const subCatNameElement = subCatDiv.querySelector('h5');
                subCatNameElement.style.cursor = 'pointer'; // 클릭 가능한 시각적 표시
                subCatNameElement.addEventListener('click', () => {
                    currentMainCategory = mainCatName;
                    // isGroup인 경우, 해당 그룹의 첫 번째 서브 카테고리로 설정
                    if (subCat.isGroup && subCat.subCategories && subCat.subCategories.length > 0) {
                        currentSubCategoryName = subCat.subCategories[0].name;
                    } else {
                        currentSubCategoryName = subCat.name;
                    }
                    currentSearchKeyword = ""; // 카테고리 변경 시 검색 키워드 초기화
                    searchInput.value = ""; // 검색 입력 필드 초기화
                    currentPageNum = "1"; // 카테고리 변경 시 첫 페이지로
                    currentListOrder = "C.pd_suggest desc,C.pd_sold desc"; // 카테고리 변경 시 인기상품순으로 초기화

                    // 모든 정렬 버튼의 active 클래스 제거 후 인기상품순 버튼에 active 클래스 추가
                    sortButtons.forEach(btn => btn.classList.remove('active'));
                    const popularSortButton = document.querySelector('.sort-button[data-order="C.pd_suggest desc,C.pd_sold desc"]');
                    if (popularSortButton) {
                        popularSortButton.classList.add('active');
                    }
                    // 모든 페이지 버튼의 active 클래스를 제거하고 첫 번째 페이지 버튼에만 추가
                    document.querySelectorAll('.page-button').forEach(btn => btn.classList.remove('active'));
                    const initialPageButton = paginationElement.querySelector(`.page-button[data-page="1"]`);
                    if (initialPageButton) {
                        initialPageButton.classList.add('active');
                    }


                    renderProducts(); // 상품 목록 다시 로드
                });
                // --- 서브 카테고리 이름 클릭 이벤트 추가 끝 ---


                const selectedItemsList = document.createElement('ul');
                selectedItemsList.className = 'selected-items-list';
                selectedItemsList.id = `list-${mainCatName}-${subCat.name.replace(/\s/g, '-')}`;
                subCatDiv.appendChild(selectedItemsList);
                subCategoriesContainer.appendChild(subCatDiv);

                // 선택된 상품이 있으면 리스트에 추가
                if (selectedComponents[mainCatName] && selectedComponents[mainCatName][subCat.name]) {
                    selectedComponents[mainCatName][subCat.name].forEach(item => {
                        const listItem = document.createElement('li');
                        listItem.className = 'selected-item';
                        listItem.innerHTML = `
                            <div class="item-info">
                                <span class="item-name">${item.name}</span>
                                <span class="item-price">${parseInt(item.price * item.quantity).toLocaleString()} 원</span>
                            </div>
                            <div class="item-quantity-controls">
                                <button class="quantity-button decrease"
                                    data-item-id="${item.id}"
                                    data-category="${mainCatName}"
                                    data-subcategory="${subCat.name}">-</button>
                                <span class="quantity-display">${item.quantity}</span>
                                <button class="quantity-button increase"
                                    data-item-id="${item.id}"
                                    data-category="${mainCatName}"
                                    data-subcategory="${subCat.name}">+</button>
                            </div>
                            <button class="remove-button" data-item-id="${item.id}"
                                data-category="${mainCatName}" data-subcategory="${subCat.name}">X</button>
                        `;
                        selectedItemsList.appendChild(listItem);
                    });
                }
            });

            estimateCategoriesElement.appendChild(groupDiv);

            // 토글 기능 추가
            groupHeader.addEventListener('click', () => {
                groupDiv.classList.toggle('expanded');
                groupHeader.classList.toggle('collapsed');
                // 확장/축소 상태를 Set에 저장/제거
                if (groupDiv.classList.contains('expanded')) {
                    expandedCategories.add(mainCatName);
                } else {
                    expandedCategories.delete(mainCatName);
                }
            });
        }
        updateTotalEstimatePrice();
    }

    // 이벤트 리스너 등록

    // 검색 버튼 클릭
    searchButton.addEventListener('click', () => {
        currentSearchKeyword = searchInput.value;
        currentPageNum = "1"; // 검색 시 첫 페이지로
        renderProducts();
    });

    // 정렬 버튼 클릭
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            sortButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentListOrder = button.dataset.order;
            currentPageNum = "1"; // 정렬 시 첫 페이지로
            renderProducts();
        });
    });

    // 상품 담기 버튼 클릭 (이벤트 위임)
    productListElement.addEventListener('click', (event) => {
        if (event.target.classList.contains('add-button')) {
            const button = event.target;
            const category = button.dataset.category;
            const subCategory = button.dataset.subcategory;
            const name = button.dataset.name;
            const price = button.dataset.price;

            if (!selectedComponents[category]) {
                selectedComponents[category] = {};
            }
            if (!selectedComponents[category][subCategory]) {
                selectedComponents[category][subCategory] = [];
            }

            // 동일한 이름의 상품이 이미 담겨있는지 확인
            const existingItem = selectedComponents[category][subCategory].find(item => item.name === name);

            if (existingItem) {
                // 이미 있다면 수량만 증가
                existingItem.quantity += 1;
            } else {
                // 없다면 새로 추가 (quantity: 1)
                const id = Date.now().toString(); // 고유 ID 생성 (간단한 예시)
                selectedComponents[category][subCategory].push({ id, name, price, quantity: 1 });
            }
            renderEstimateSidebar(); // 사이드바 다시 렌더링하여 변경사항 반영
        }
    });

    // 선택된 항목 제거 및 수량 조절 버튼 클릭 (이벤트 위임)
    estimateCategoriesElement.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-button')) {
            const button = event.target;
            const itemIdToRemove = button.dataset.itemId;
            const category = button.dataset.category;
            const subCategory = button.dataset.subcategory;

            if (selectedComponents[category] && selectedComponents[category][subCategory]) {
                selectedComponents[category][subCategory] = selectedComponents[category][subCategory].filter(item => item.id !== itemIdToRemove);
                // 만약 해당 서브카테고리에 아이템이 하나도 없으면 서브카테고리 객체에서 제거
                if (selectedComponents[category][subCategory].length === 0) {
                    delete selectedComponents[category][subCategory];
                    // 만약 해당 메인카테고리에 서브카테고리가 하나도 없으면 메인카테고리 객체에서 제거
                    if (Object.keys(selectedComponents[category]).length === 0) {
                        delete selectedComponents[category];
                    }
                }
            }
            renderEstimateSidebar(); // 사이드바 다시 렌더링
        } else if (event.target.classList.contains('quantity-button')) {
            const button = event.target;
            const itemIdToModify = button.dataset.itemId;
            const category = button.dataset.category;
            const subCategory = button.dataset.subcategory;
            const action = button.classList.contains('increase') ? 'increase' : 'decrease';

            if (selectedComponents[category] && selectedComponents[category][subCategory]) {
                const itemIndex = selectedComponents[category][subCategory].findIndex(item => item.id === itemIdToModify);

                if (itemIndex !== -1) {
                    if (action === 'increase') {
                        selectedComponents[category][subCategory][itemIndex].quantity += 1;
                    } else if (action === 'decrease') {
                        if (selectedComponents[category][subCategory][itemIndex].quantity > 1) {
                            selectedComponents[category][subCategory][itemIndex].quantity -= 1;
                        } else {
                            // 수량이 1인데 감소 버튼을 누르면 항목 제거
                            selectedComponents[category][subCategory].splice(itemIndex, 1);
                            if (selectedComponents[category][subCategory].length === 0) {
                                delete selectedComponents[category][subCategory];
                                if (Object.keys(selectedComponents[category]).length === 0) {
                                    delete selectedComponents[category];
                                }
                            }
                        }
                    }
                    renderEstimateSidebar(); // 수량 변경 후 사이드바 다시 렌더링
                }
            }
        }
    });

    // 페이지네이션 버튼 클릭 (예시)
    paginationElement.addEventListener('click', (event) => {
        if (event.target.classList.contains('page-button')) {
            currentPageNum = event.target.dataset.page;
            // 모든 페이지 버튼의 active 클래스를 제거하고 현재 클릭된 버튼에만 추가
            document.querySelectorAll('.page-button').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            renderProducts();
        }
    });


    // 초기 로드 시 상품 및 사이드바 렌더링
    renderProducts();
    renderEstimateSidebar();

    // 초기 페이지 버튼 활성화 (페이지네이션 구현에 따라 조정)
    const initialPageButton = paginationElement.querySelector(`.page-button[data-page="${currentPageNum}"]`);
    if (initialPageButton) {
        initialPageButton.classList.add('active');
    }
});